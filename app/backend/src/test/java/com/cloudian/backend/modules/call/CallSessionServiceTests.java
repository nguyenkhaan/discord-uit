package com.cloudian.backend.modules.call;

import com.cloudian.backend.commons.enums.CallEventType;
import com.cloudian.backend.commons.enums.CallStatus;
import com.cloudian.backend.exceptions.ApiException;
import com.cloudian.backend.models.CallParticipation;
import com.cloudian.backend.models.CallSession;
import com.cloudian.backend.models.Server;
import com.cloudian.backend.models.UserAccount;
import com.cloudian.backend.repositories.CallParticipationRepository;
import com.cloudian.backend.repositories.CallSessionRepository;
import com.cloudian.backend.repositories.ServerMembershipRepository;
import com.cloudian.backend.repositories.ServerRepository;
import com.cloudian.backend.repositories.UserAccountRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CallSessionServiceTests {

    private static final UUID SERVER_ID = UUID.fromString("0f8fad5b-d9cb-469f-a165-70867728950e");
    private static final UUID CALL_ID = UUID.fromString("22222222-2222-4222-8222-222222222222");
    private static final UUID COORDINATOR_ID = UUID.fromString("00000000-0000-4000-8000-000000000001");
    private static final UUID OWNER_ID = UUID.fromString("00000000-0000-4000-8000-000000000002");
    private static final UUID TARGET_ID = UUID.fromString("00000000-0000-4000-8000-000000000003");
    private static final String ROOM = "call-test";

    @Mock private CallSessionRepository callSessionRepository;
    @Mock private CallParticipationRepository callParticipationRepository;
    @Mock private ServerRepository serverRepository;
    @Mock private ServerMembershipRepository serverMembershipRepository;
    @Mock private UserAccountRepository userAccountRepository;
    @Mock private CallEventService callEventService;

    @InjectMocks
    private CallSessionService service;

    @Test
    void ownerWhoIsNotCoordinatorCannotForceMute() {
        givenLockedActiveCall(call(null));

        assertStatus(
                () -> service.authorizeForceMute(SERVER_ID, OWNER_ID, TARGET_ID),
                HttpStatus.FORBIDDEN);

        // Server role is never consulted for call controls.
        verifyNoInteractions(serverMembershipRepository, callEventService);
    }

    @Test
    void absentCoordinatorCannotControl() {
        givenLockedActiveCall(call(TARGET_ID));
        givenInCall(COORDINATOR_ID, false);

        assertStatus(
                () -> service.authorizeForceStopScreenShare(SERVER_ID, COORDINATOR_ID, TARGET_ID),
                HttpStatus.FORBIDDEN);

        verifyNoInteractions(callEventService);
    }

    @Test
    void presentCoordinatorCanForceStopCurrentSharer() {
        CallSession call = call(TARGET_ID);
        givenLockedActiveCall(call);
        givenInCall(COORDINATOR_ID, true);
        givenInCall(TARGET_ID, true);

        CallSession authorized = service
                .authorizeForceStopScreenShare(SERVER_ID, COORDINATOR_ID, TARGET_ID);
        service.completeForceStopScreenShare(authorized, COORDINATOR_ID, TARGET_ID);

        assertThat(call.getActiveScreenSharer()).isNull();
        verify(callEventService).record(
                call, COORDINATOR_ID, TARGET_ID, CallEventType.FORCE_SCREEN_SHARE_STOP);
    }

    @Test
    void secondSharerGetsConflict() {
        givenLockedActiveCall(call(TARGET_ID));
        givenInCall(OWNER_ID, true);

        assertStatus(
                () -> service.startScreenShare(SERVER_ID, OWNER_ID),
                HttpStatus.CONFLICT);

        verify(callSessionRepository, never()).save(any());
        verifyNoInteractions(callEventService);
    }

    @Test
    void stopScreenShareIsIdempotent() {
        givenLockedActiveCall(call(null));

        String roomName = service.stopScreenShare(SERVER_ID, TARGET_ID);

        assertThat(roomName).isEqualTo(ROOM);
        verifyNoInteractions(callEventService);
    }

    @Test
    void unpublishedWebhookReleasesSharerOnce() {
        Server server = mock(Server.class);
        when(server.getId()).thenReturn(SERVER_ID);
        CallSession call = call(TARGET_ID);
        call.setServer(server);
        when(callSessionRepository.findByLivekitRoomNameAndStatus(ROOM, CallStatus.ACTIVE))
                .thenReturn(Optional.of(call));
        when(serverRepository.findByIdAndDeletedAtIsNullForUpdate(SERVER_ID))
                .thenReturn(Optional.of(server));

        assertThat(service.handleScreenShareUnpublishedWebhook(ROOM, TARGET_ID)).isTrue();
        assertThat(service.handleScreenShareUnpublishedWebhook(ROOM, TARGET_ID)).isFalse();

        assertThat(call.getActiveScreenSharer()).isNull();
        verify(callEventService, times(1)).record(
                call, TARGET_ID, null, CallEventType.SCREEN_SHARE_STOPPED);
    }

    // ---------- helpers ----------

    private CallSession call(UUID sharerId) {
        CallSession call = new CallSession();
        call.setId(CALL_ID);
        call.setLivekitRoomName(ROOM);
        call.setStatus(CallStatus.ACTIVE);
        call.setCoordinator(user(COORDINATOR_ID));
        if (sharerId != null) {
            call.setActiveScreenSharer(user(sharerId));
        }
        return call;
    }

    private UserAccount user(UUID id) {
        UserAccount user = new UserAccount();
        user.setId(id);
        return user;
    }

    private void givenLockedActiveCall(CallSession call) {
        when(serverRepository.findByIdAndDeletedAtIsNullForUpdate(SERVER_ID))
                .thenReturn(Optional.of(mock(Server.class)));
        when(callSessionRepository.findByServer_IdAndStatus(SERVER_ID, CallStatus.ACTIVE))
                .thenReturn(Optional.of(call));
    }

    private void givenInCall(UUID userId, boolean active) {
        when(callParticipationRepository.findByCallSession_IdAndUser_IdAndLeftAtIsNull(CALL_ID, userId))
                .thenReturn(active ? Optional.of(new CallParticipation()) : Optional.empty());
    }

    private void assertStatus(Runnable action, HttpStatus status) {
        assertThatThrownBy(action::run)
                .isInstanceOfSatisfying(ApiException.class,
                        ex -> assertThat(ex.getStatus()).isEqualTo(status));
    }
}