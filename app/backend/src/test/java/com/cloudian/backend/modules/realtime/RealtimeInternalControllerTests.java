package com.cloudian.backend.modules.realtime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.cloudian.backend.commons.enums.AccountStatus;
import com.cloudian.backend.commons.enums.SystemRole;
import com.cloudian.backend.models.UserAccount;
import com.cloudian.backend.modules.realtime.dto.RealtimeSessionResponse;
import com.cloudian.backend.modules.realtime.dto.RealtimeServerAuthorizationResponse;
import com.cloudian.backend.modules.realtime.dto.RealtimeChatMessageRequest;
import com.cloudian.backend.modules.realtime.dto.RealtimeChatMessageResponse;
import com.cloudian.backend.commons.enums.ServerMemberRole;
import com.cloudian.backend.security.CustomUserDetails;

class RealtimeInternalControllerTests {

    @Test
    void returnsTheAuthenticatedUserAndValidatedSession() {
        UUID userId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        RealtimeInternalController controller = new RealtimeInternalController(
                mock(RealtimeAuthorizationService.class),
                mock(RealtimeChatMessageService.class));

        RealtimeSessionResponse response = controller.validateSession(
                userDetails(userId),
                sessionId);

        assertThat(response.userId()).isEqualTo(userId);
        assertThat(response.sessionId()).isEqualTo(sessionId);
        assertThat(response.accountStatus()).isEqualTo(AccountStatus.ACTIVE);
    }

    @Test
    void authorizesThePrincipalForTheRequestedServer() {
        UUID userId = UUID.randomUUID();
        UUID serverId = UUID.randomUUID();
        RealtimeAuthorizationService authorizationService =
                mock(RealtimeAuthorizationService.class);
        RealtimeInternalController controller =
                new RealtimeInternalController(
                        authorizationService,
                        mock(RealtimeChatMessageService.class));
        RealtimeServerAuthorizationResponse expected =
                new RealtimeServerAuthorizationResponse(
                        serverId,
                        ServerMemberRole.MEMBER);
        when(authorizationService.authorizeServer(serverId, userId))
                .thenReturn(expected);

        RealtimeServerAuthorizationResponse response = controller.authorizeServer(
                serverId,
                userDetails(userId));

        assertThat(response).isEqualTo(expected);
        verify(authorizationService).authorizeServer(serverId, userId);
    }

    @Test
    void createsAChatMessageAsTheAuthenticatedPrincipal() {
        UUID userId = UUID.randomUUID();
        UUID serverId = UUID.randomUUID();
        UUID clientRequestId = UUID.randomUUID();
        RealtimeChatMessageRequest request = new RealtimeChatMessageRequest(
                clientRequestId,
                "Hello realtime");
        RealtimeChatMessageResponse expected = new RealtimeChatMessageResponse(
                UUID.randomUUID(),
                serverId,
                userId,
                clientRequestId,
                "Hello realtime",
                Instant.parse("2026-11-05T03:00:00Z"));
        RealtimeChatMessageService messageService =
                mock(RealtimeChatMessageService.class);
        RealtimeInternalController controller = new RealtimeInternalController(
                mock(RealtimeAuthorizationService.class),
                messageService);
        when(messageService.createOrGet(serverId, userId, request))
                .thenReturn(expected);

        RealtimeChatMessageResponse response = controller.createChatMessage(
                serverId,
                userDetails(userId),
                request);

        assertThat(response).isEqualTo(expected);
        verify(messageService).createOrGet(serverId, userId, request);
    }

    private CustomUserDetails userDetails(UUID userId) {
        UserAccount user = new UserAccount();
        user.setId(userId);
        user.setEmail("person@example.com");
        user.setPasswordHash("password-hash");
        user.setAccountStatus(AccountStatus.ACTIVE);
        user.setSystemRole(SystemRole.USER);
        return new CustomUserDetails(user);
    }
}
