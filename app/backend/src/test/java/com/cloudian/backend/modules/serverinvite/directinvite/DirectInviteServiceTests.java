package com.cloudian.backend.modules.serverinvite.directinvite;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;

import com.cloudian.backend.commons.enums.ServerInviteStatus;
import com.cloudian.backend.commons.enums.ServerInviteType;
import com.cloudian.backend.commons.enums.ServerMemberRole;
import com.cloudian.backend.exceptions.ApiException;
import com.cloudian.backend.models.Server;
import com.cloudian.backend.models.ServerInvite;
import com.cloudian.backend.models.ServerMembership;
import com.cloudian.backend.models.UserAccount;
import com.cloudian.backend.modules.notification.NotificationService;
import com.cloudian.backend.modules.serverinvite.directinvite.dto.CreateDirectInviteRequest;
import com.cloudian.backend.modules.serverinvite.messaging.ServerInviteEventWriter;
import com.cloudian.backend.repositories.ServerInviteRepository;
import com.cloudian.backend.repositories.ServerMembershipRepository;
import com.cloudian.backend.repositories.ServerRepository;
import com.cloudian.backend.repositories.UserAccountRepository;

class DirectInviteServiceTests {

    private ServerInviteRepository inviteRepository;
    private ServerRepository serverRepository;
    private ServerMembershipRepository membershipRepository;
    private UserAccountRepository userRepository;
    private NotificationService notificationService;
    private ServerInviteEventWriter eventWriter;
    private DirectInviteService directInviteService;

    @BeforeEach
    void setUp() {
        inviteRepository = mock(ServerInviteRepository.class);
        serverRepository = mock(ServerRepository.class);
        membershipRepository = mock(ServerMembershipRepository.class);
        userRepository = mock(UserAccountRepository.class);
        notificationService = mock(NotificationService.class);
        eventWriter = mock(ServerInviteEventWriter.class);
        directInviteService = new DirectInviteService(
                inviteRepository,
                serverRepository,
                membershipRepository,
                userRepository,
                notificationService,
                eventWriter);
    }

    @Test
    void createsDirectInviteAndNotificationForSavedInvite() {
        UUID serverId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        UUID recipientId = UUID.randomUUID();
        UUID inviteId = UUID.randomUUID();
        Server server = server(serverId);
        UserAccount owner = user(ownerId);
        UserAccount recipient = user(recipientId);

        when(serverRepository.findByIdAndDeletedAtIsNullForUpdate(serverId)).thenReturn(Optional.of(server));
        when(membershipRepository.existsByServer_IdAndUser_IdAndRoleAndLeftAtIsNull(
                serverId, ownerId, ServerMemberRole.OWNER)).thenReturn(true);
        when(userRepository.findById(recipientId)).thenReturn(Optional.of(recipient));
        when(membershipRepository.findByServer_IdAndUser_IdAndLeftAtIsNull(serverId, recipientId))
                .thenReturn(Optional.empty());
        when(inviteRepository.existsByServer_IdAndRecipient_IdAndStatus(
                serverId, recipientId, ServerInviteStatus.PENDING)).thenReturn(false);
        when(userRepository.findById(ownerId)).thenReturn(Optional.of(owner));
        when(inviteRepository.save(any(ServerInvite.class))).thenAnswer(invocation -> {
            ServerInvite invite = invocation.getArgument(0);
            invite.setId(inviteId);
            return invite;
        });

        var response = directInviteService.createDirectInvite(
                serverId,
                ownerId,
                new CreateDirectInviteRequest(recipientId));

        ArgumentCaptor<ServerInvite> inviteCaptor = ArgumentCaptor.forClass(ServerInvite.class);
        verify(inviteRepository).save(inviteCaptor.capture());
        ServerInvite savedInvite = inviteCaptor.getValue();
        assertThat(savedInvite.getInviteType()).isEqualTo(ServerInviteType.DIRECT);
        assertThat(savedInvite.getRecipient()).isSameAs(recipient);
        assertThat(response.inviteId()).isEqualTo(inviteId);
        verify(notificationService).createServerInvitationNotification(
                owner, recipient, inviteId, server.getName());
    }

    @Test
    void rejectsDirectInviteCreationFromNonOwner() {
        UUID serverId = UUID.randomUUID();
        UUID currentUserId = UUID.randomUUID();
        when(serverRepository.findByIdAndDeletedAtIsNullForUpdate(serverId))
                .thenReturn(Optional.of(server(serverId)));
        when(membershipRepository.existsByServer_IdAndUser_IdAndRoleAndLeftAtIsNull(
                serverId, currentUserId, ServerMemberRole.OWNER)).thenReturn(false);

        assertThatThrownBy(() -> directInviteService.createDirectInvite(
                serverId,
                currentUserId,
                new CreateDirectInviteRequest(UUID.randomUUID())))
                .isInstanceOfSatisfying(ApiException.class, exception ->
                        assertThat(exception.getStatus()).isEqualTo(HttpStatus.FORBIDDEN));

        verify(inviteRepository, never()).save(any());
        verify(notificationService, never()).createServerInvitationNotification(
                any(), any(), any(), any());
    }

    @Test
    void rejectsExpiredDirectInviteBeforeCreatingMembership() {
        UUID recipientId = UUID.randomUUID();
        ServerInvite invite = directInvite(recipientId);
        invite.setExpiresAt(Instant.parse("2020-01-01T00:00:00Z"));
        when(inviteRepository.findByIdForUpdate(invite.getId())).thenReturn(Optional.of(invite));

        assertThatThrownBy(() -> directInviteService.acceptDirectInvite(invite.getId(), recipientId))
                .isInstanceOfSatisfying(ApiException.class, exception ->
                        assertThat(exception.getStatus()).isEqualTo(HttpStatus.GONE));

        verify(membershipRepository, never()).save(any());
        verify(eventWriter, never()).writeMembershipCreated(any());
    }

    @Test
    void rejectsDirectInviteActionFromAnotherUser() {
        UUID recipientId = UUID.randomUUID();
        UUID anotherUserId = UUID.randomUUID();
        ServerInvite invite = directInvite(recipientId);
        when(inviteRepository.findByIdForUpdate(invite.getId())).thenReturn(Optional.of(invite));

        assertThatThrownBy(() -> directInviteService.acceptDirectInvite(invite.getId(), anotherUserId))
                .isInstanceOfSatisfying(ApiException.class, exception ->
                        assertThat(exception.getStatus()).isEqualTo(HttpStatus.FORBIDDEN));

        verify(membershipRepository, never()).save(any());
        verify(eventWriter, never()).writeMembershipCreated(any());
    }

    @Test
    void acceptsDirectInviteAndRecordsMembershipEvent() {
        UUID recipientId = UUID.randomUUID();
        ServerInvite invite = directInvite(recipientId);
        UserAccount recipient = invite.getRecipient();
        Server server = invite.getServer();
        UUID membershipId = UUID.randomUUID();

        when(inviteRepository.findByIdForUpdate(invite.getId())).thenReturn(Optional.of(invite));
        when(serverRepository.findByIdAndDeletedAtIsNullForUpdate(server.getId()))
                .thenReturn(Optional.of(server));
        when(membershipRepository.findByServer_IdAndUser_IdAndLeftAtIsNull(server.getId(), recipientId))
                .thenReturn(Optional.empty());
        when(userRepository.findById(recipientId)).thenReturn(Optional.of(recipient));
        when(membershipRepository.save(any(ServerMembership.class))).thenAnswer(invocation -> {
            ServerMembership membership = invocation.getArgument(0);
            membership.setId(membershipId);
            return membership;
        });

        var response = directInviteService.acceptDirectInvite(invite.getId(), recipientId);

        ArgumentCaptor<ServerMembership> membershipCaptor = ArgumentCaptor.forClass(ServerMembership.class);
        verify(membershipRepository).save(membershipCaptor.capture());
        ServerMembership membership = membershipCaptor.getValue();
        assertThat(membership.getRole()).isEqualTo(ServerMemberRole.MEMBER);
        assertThat(invite.getStatus()).isEqualTo(ServerInviteStatus.ACCEPTED);
        assertThat(invite.getAcceptedAt()).isNotNull();
        assertThat(response.status()).isEqualTo(ServerInviteStatus.ACCEPTED);
        verify(eventWriter).writeMembershipCreated(membership);
    }

    @Test
    void declinesPendingDirectInviteForItsRecipient() {
        UUID recipientId = UUID.randomUUID();
        ServerInvite invite = directInvite(recipientId);
        when(inviteRepository.findByIdForUpdate(invite.getId())).thenReturn(Optional.of(invite));

        var response = directInviteService.declineDirectInvite(invite.getId(), recipientId);

        assertThat(invite.getStatus()).isEqualTo(ServerInviteStatus.DECLINED);
        assertThat(invite.getDeclinedAt()).isNotNull();
        assertThat(response.status()).isEqualTo(ServerInviteStatus.DECLINED);
    }

    private static ServerInvite directInvite(UUID recipientId) {
        ServerInvite invite = new ServerInvite();
        invite.setId(UUID.randomUUID());
        invite.setServer(server(UUID.randomUUID()));
        invite.setRecipient(user(recipientId));
        invite.setInviteType(ServerInviteType.DIRECT);
        invite.setStatus(ServerInviteStatus.PENDING);
        return invite;
    }

    private static Server server(UUID serverId) {
        Server server = new Server();
        server.setId(serverId);
        server.setName("Software Engineering");
        return server;
    }

    private static UserAccount user(UUID userId) {
        UserAccount user = new UserAccount();
        user.setId(userId);
        user.setEmail(userId + "@example.com");
        return user;
    }
}
