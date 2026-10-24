package com.cloudian.backend.modules.serverinvite.invitelink;

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
import com.cloudian.backend.modules.serverinvite.invitelink.dto.CreateInviteLinkRequest;
import com.cloudian.backend.modules.serverinvite.messaging.ServerInviteEventWriter;
import com.cloudian.backend.repositories.ServerInviteRepository;
import com.cloudian.backend.repositories.ServerMembershipRepository;
import com.cloudian.backend.repositories.ServerRepository;
import com.cloudian.backend.repositories.UserAccountRepository;
import com.cloudian.backend.utils.TokenHashUtil;

class InviteLinkServiceTests {

    private ServerInviteRepository inviteRepository;
    private ServerRepository serverRepository;
    private ServerMembershipRepository membershipRepository;
    private UserAccountRepository userRepository;
    private ServerInviteEventWriter eventWriter;
    private InviteLinkService inviteLinkService;

    @BeforeEach
    void setUp() {
        inviteRepository = mock(ServerInviteRepository.class);
        serverRepository = mock(ServerRepository.class);
        membershipRepository = mock(ServerMembershipRepository.class);
        userRepository = mock(UserAccountRepository.class);
        eventWriter = mock(ServerInviteEventWriter.class);
        inviteLinkService = new InviteLinkService(
                inviteRepository,
                serverRepository,
                membershipRepository,
                userRepository,
                eventWriter);
        inviteLinkService.setInviteBaseUrl("http://localhost:5173/invite");
    }

    @Test
    void createsLinkWithOnlyHashedTokenPersisted() {
        UUID serverId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        UUID inviteId = UUID.randomUUID();
        Server server = server(serverId);
        UserAccount owner = user(ownerId);
        when(serverRepository.findByIdAndDeletedAtIsNull(serverId)).thenReturn(Optional.of(server));
        when(membershipRepository.existsByServer_IdAndUser_IdAndRoleAndLeftAtIsNull(
                serverId, ownerId, ServerMemberRole.OWNER)).thenReturn(true);
        when(userRepository.findById(ownerId)).thenReturn(Optional.of(owner));
        when(inviteRepository.save(any(ServerInvite.class))).thenAnswer(invocation -> {
            ServerInvite invite = invocation.getArgument(0);
            invite.setId(inviteId);
            return invite;
        });

        var response = inviteLinkService.createInviteLink(
                serverId,
                ownerId,
                new CreateInviteLinkRequest(3, 24));

        String rawToken = response.inviteUrl().substring(response.inviteUrl().lastIndexOf('/') + 1);
        ArgumentCaptor<ServerInvite> inviteCaptor = ArgumentCaptor.forClass(ServerInvite.class);
        verify(inviteRepository).save(inviteCaptor.capture());
        assertThat(inviteCaptor.getValue().getTokenHash()).isEqualTo(TokenHashUtil.sha256Hex(rawToken));
        assertThat(inviteCaptor.getValue().getTokenHash()).doesNotContain(rawToken);
    }

    @Test
    void rejectsInviteLinkCreationFromNonOwner() {
        UUID serverId = UUID.randomUUID();
        UUID currentUserId = UUID.randomUUID();
        when(serverRepository.findByIdAndDeletedAtIsNull(serverId))
                .thenReturn(Optional.of(server(serverId)));
        when(membershipRepository.existsByServer_IdAndUser_IdAndRoleAndLeftAtIsNull(
                serverId, currentUserId, ServerMemberRole.OWNER)).thenReturn(false);

        assertThatThrownBy(() -> inviteLinkService.createInviteLink(
                serverId,
                currentUserId,
                new CreateInviteLinkRequest(3, 24)))
                .isInstanceOfSatisfying(ApiException.class, exception ->
                        assertThat(exception.getStatus()).isEqualTo(HttpStatus.FORBIDDEN));

        verify(inviteRepository, never()).save(any());
    }

    @Test
    void rejectsInviteLinkListingFromNonOwner() {
        UUID serverId = UUID.randomUUID();
        UUID currentUserId = UUID.randomUUID();
        when(serverRepository.findByIdAndDeletedAtIsNull(serverId))
                .thenReturn(Optional.of(server(serverId)));
        when(membershipRepository.existsByServer_IdAndUser_IdAndRoleAndLeftAtIsNull(
                serverId, currentUserId, ServerMemberRole.OWNER)).thenReturn(false);

        assertThatThrownBy(() -> inviteLinkService.getInviteLinks(serverId, currentUserId))
                .isInstanceOfSatisfying(ApiException.class, exception ->
                        assertThat(exception.getStatus()).isEqualTo(HttpStatus.FORBIDDEN));

        verify(inviteRepository, never()).findByServer_IdAndInviteType(any(), any());
    }

    @Test
    void rejectsInviteLinkRevocationFromNonOwner() {
        UUID serverId = UUID.randomUUID();
        UUID currentUserId = UUID.randomUUID();
        when(serverRepository.findByIdAndDeletedAtIsNull(serverId))
                .thenReturn(Optional.of(server(serverId)));
        when(membershipRepository.existsByServer_IdAndUser_IdAndRoleAndLeftAtIsNull(
                serverId, currentUserId, ServerMemberRole.OWNER)).thenReturn(false);

        assertThatThrownBy(() -> inviteLinkService.revokeInviteLink(
                serverId,
                UUID.randomUUID(),
                currentUserId))
                .isInstanceOfSatisfying(ApiException.class, exception ->
                        assertThat(exception.getStatus()).isEqualTo(HttpStatus.FORBIDDEN));

        verify(inviteRepository, never()).findByIdAndServerIdForUpdate(any(), any());
    }

    @Test
    void revokesOnlyLockedLinkAndRecordsTimestamp() {
        UUID serverId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        ServerInvite invite = linkInvite(serverId, 3, 0);
        when(serverRepository.findByIdAndDeletedAtIsNull(serverId)).thenReturn(Optional.of(invite.getServer()));
        when(membershipRepository.existsByServer_IdAndUser_IdAndRoleAndLeftAtIsNull(
                serverId, ownerId, ServerMemberRole.OWNER)).thenReturn(true);
        when(inviteRepository.findByIdAndServerIdForUpdate(invite.getId(), serverId))
                .thenReturn(Optional.of(invite));

        inviteLinkService.revokeInviteLink(serverId, invite.getId(), ownerId);

        assertThat(invite.getStatus()).isEqualTo(ServerInviteStatus.REVOKED);
        assertThat(invite.getRevokedAt()).isNotNull();
    }

    @Test
    void rejectsExpiredLinkWithoutCreatingMembership() {
        UUID userId = UUID.randomUUID();
        ServerInvite invite = linkInvite(UUID.randomUUID(), 2, 0);
        invite.setExpiresAt(Instant.parse("2020-01-01T00:00:00Z"));
        when(inviteRepository.findByTokenHashForUpdate(invite.getTokenHash())).thenReturn(Optional.of(invite));

        assertThatThrownBy(() -> inviteLinkService.joinServerByInviteLink("raw-token", userId))
                .isInstanceOfSatisfying(ApiException.class, exception ->
                        assertThat(exception.getStatus()).isEqualTo(HttpStatus.GONE));

        verify(membershipRepository, never()).save(any());
        verify(eventWriter, never()).writeMembershipCreated(any());
    }

    @Test
    void rejectsExhaustedLinkWithoutCreatingMembership() {
        UUID userId = UUID.randomUUID();
        ServerInvite invite = linkInvite(UUID.randomUUID(), 1, 1);
        when(inviteRepository.findByTokenHashForUpdate(invite.getTokenHash())).thenReturn(Optional.of(invite));

        assertThatThrownBy(() -> inviteLinkService.joinServerByInviteLink("raw-token", userId))
                .isInstanceOfSatisfying(ApiException.class, exception ->
                        assertThat(exception.getStatus()).isEqualTo(HttpStatus.GONE));

        verify(membershipRepository, never()).save(any());
        verify(eventWriter, never()).writeMembershipCreated(any());
    }

    @Test
    void rejectsDirectInviteUsedAsLink() {
        UUID userId = UUID.randomUUID();
        ServerInvite invite = linkInvite(UUID.randomUUID(), 1, 0);
        invite.setInviteType(ServerInviteType.DIRECT);
        when(inviteRepository.findByTokenHashForUpdate(invite.getTokenHash())).thenReturn(Optional.of(invite));

        assertThatThrownBy(() -> inviteLinkService.joinServerByInviteLink("raw-token", userId))
                .isInstanceOfSatisfying(ApiException.class, exception ->
                        assertThat(exception.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));

        verify(membershipRepository, never()).save(any());
        verify(eventWriter, never()).writeMembershipCreated(any());
    }

    @Test
    void rejectsRevokedLinkWithoutCreatingMembership() {
        UUID userId = UUID.randomUUID();
        ServerInvite invite = linkInvite(UUID.randomUUID(), 2, 0);
        invite.setStatus(ServerInviteStatus.REVOKED);
        when(inviteRepository.findByTokenHashForUpdate(invite.getTokenHash())).thenReturn(Optional.of(invite));

        assertThatThrownBy(() -> inviteLinkService.joinServerByInviteLink("raw-token", userId))
                .isInstanceOfSatisfying(ApiException.class, exception ->
                        assertThat(exception.getStatus()).isEqualTo(HttpStatus.GONE));

        verify(membershipRepository, never()).save(any());
        verify(eventWriter, never()).writeMembershipCreated(any());
    }

    @Test
    void finalRedemptionCreatesMembershipAndFinalizesLink() {
        UUID userId = UUID.randomUUID();
        ServerInvite invite = linkInvite(UUID.randomUUID(), 1, 0);
        UserAccount user = user(userId);
        UUID membershipId = UUID.randomUUID();
        when(inviteRepository.findByTokenHashForUpdate(invite.getTokenHash())).thenReturn(Optional.of(invite));
        when(serverRepository.findByIdAndDeletedAtIsNullForUpdate(invite.getServer().getId()))
                .thenReturn(Optional.of(invite.getServer()));
        when(membershipRepository.findByServer_IdAndUser_IdAndLeftAtIsNull(
                invite.getServer().getId(), userId)).thenReturn(Optional.empty());
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(membershipRepository.save(any(ServerMembership.class))).thenAnswer(invocation -> {
            ServerMembership membership = invocation.getArgument(0);
            membership.setId(membershipId);
            return membership;
        });

        inviteLinkService.joinServerByInviteLink("raw-token", userId);

        ArgumentCaptor<ServerMembership> membershipCaptor = ArgumentCaptor.forClass(ServerMembership.class);
        verify(membershipRepository).save(membershipCaptor.capture());
        assertThat(membershipCaptor.getValue().getRole()).isEqualTo(ServerMemberRole.MEMBER);
        assertThat(invite.getUseCount()).isEqualTo(1);
        assertThat(invite.getStatus()).isEqualTo(ServerInviteStatus.ACCEPTED);
        assertThat(invite.getAcceptedAt()).isNotNull();
        verify(eventWriter).writeMembershipCreated(membershipCaptor.getValue());
    }

    @Test
    void intermediateRedemptionKeepsLinkPending() {
        UUID userId = UUID.randomUUID();
        ServerInvite invite = linkInvite(UUID.randomUUID(), 2, 0);
        UserAccount user = user(userId);
        when(inviteRepository.findByTokenHashForUpdate(invite.getTokenHash())).thenReturn(Optional.of(invite));
        when(serverRepository.findByIdAndDeletedAtIsNullForUpdate(invite.getServer().getId()))
                .thenReturn(Optional.of(invite.getServer()));
        when(membershipRepository.findByServer_IdAndUser_IdAndLeftAtIsNull(
                invite.getServer().getId(), userId)).thenReturn(Optional.empty());
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(membershipRepository.save(any(ServerMembership.class))).thenAnswer(invocation -> {
            ServerMembership membership = invocation.getArgument(0);
            membership.setId(UUID.randomUUID());
            return membership;
        });

        inviteLinkService.joinServerByInviteLink("raw-token", userId);

        assertThat(invite.getUseCount()).isEqualTo(1);
        assertThat(invite.getStatus()).isEqualTo(ServerInviteStatus.PENDING);
        assertThat(invite.getAcceptedAt()).isNull();
    }

    private static ServerInvite linkInvite(UUID serverId, int maxUses, int useCount) {
        ServerInvite invite = new ServerInvite();
        invite.setId(UUID.randomUUID());
        invite.setServer(server(serverId));
        invite.setTokenHash(TokenHashUtil.sha256Hex("raw-token"));
        invite.setInviteType(ServerInviteType.LINK);
        invite.setStatus(ServerInviteStatus.PENDING);
        invite.setMaxUses(maxUses);
        invite.setUseCount(useCount);
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
        return user;
    }
}
