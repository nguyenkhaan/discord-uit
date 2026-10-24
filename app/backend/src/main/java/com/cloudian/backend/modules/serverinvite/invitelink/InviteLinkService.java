package com.cloudian.backend.modules.serverinvite.invitelink;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cloudian.backend.commons.enums.ServerInviteStatus;
import com.cloudian.backend.commons.enums.ServerInviteType;
import com.cloudian.backend.commons.enums.ServerMemberRole;
import com.cloudian.backend.exceptions.ApiException;
import com.cloudian.backend.models.Server;
import com.cloudian.backend.models.ServerInvite;
import com.cloudian.backend.models.ServerMembership;
import com.cloudian.backend.models.UserAccount;
import com.cloudian.backend.modules.serverinvite.invitelink.dto.CreateInviteLinkRequest;
import com.cloudian.backend.modules.serverinvite.invitelink.dto.CreateInviteLinkResponse;
import com.cloudian.backend.modules.serverinvite.invitelink.dto.InviteLinkDetailsResponse;
import com.cloudian.backend.modules.serverinvite.invitelink.dto.InviteLinkResponse;
import com.cloudian.backend.modules.serverinvite.invitelink.dto.JoinServerInviteResponse;
import com.cloudian.backend.modules.serverinvite.messaging.ServerInviteEventWriter;
import com.cloudian.backend.repositories.ServerInviteRepository;
import com.cloudian.backend.repositories.ServerMembershipRepository;
import com.cloudian.backend.repositories.ServerRepository;
import com.cloudian.backend.repositories.UserAccountRepository;
import com.cloudian.backend.utils.TokenHashUtil;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class InviteLinkService {

    private static final String SERVER_NOT_FOUND = "Server not found.";

    private final ServerInviteRepository inviteRepository;
    private final ServerRepository serverRepository;
    private final ServerMembershipRepository membershipRepository;
    private final UserAccountRepository userRepository;
    private final ServerInviteEventWriter eventWriter;

    private String inviteBaseUrl;

    @Value("${app.server-invite-base-url:http://localhost:4000/api/invites}")
    void setInviteBaseUrl(String inviteBaseUrl) {
        this.inviteBaseUrl = inviteBaseUrl;
    }

    @Transactional
    public CreateInviteLinkResponse createInviteLink(
            UUID serverId,
            UUID currentUserId,
            CreateInviteLinkRequest request) {
        Server server = findActiveServer(serverId);
        requireOwner(serverId, currentUserId, "create invite links");
        UserAccount creator = findUser(currentUserId);

        GeneratedInviteLink generatedInvite = generateInviteLink(server, creator, request);
        ServerInvite savedInvite = inviteRepository.save(generatedInvite.invite());

        return new CreateInviteLinkResponse(
                savedInvite.getId(),
                inviteBaseUrl + "/" + generatedInvite.rawToken(),
                savedInvite.getMaxUses(),
                savedInvite.getUseCount(),
                savedInvite.getExpiresAt(),
                savedInvite.getStatus());
    }

    @Transactional
    public void revokeInviteLink(UUID serverId, UUID inviteId, UUID currentUserId) {
        findActiveServer(serverId);
        requireOwner(serverId, currentUserId, "revoke invite links");

        ServerInvite invite = inviteRepository.findByIdAndServerIdForUpdate(inviteId, serverId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Invite link not found."));
        requireLinkInvite(invite);
        requireRevocable(invite);
        invite.setStatus(ServerInviteStatus.REVOKED);
        invite.setRevokedAt(Instant.now());
        inviteRepository.save(invite);
    }

    @Transactional(readOnly = true)
    public List<InviteLinkResponse> getInviteLinks(UUID serverId, UUID currentUserId) {
        findActiveServer(serverId);
        requireOwner(serverId, currentUserId, "view invite links");
        return inviteRepository.findByServer_IdAndInviteType(serverId, ServerInviteType.LINK)
                .stream()
                .map(this::toInviteLinkResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public InviteLinkDetailsResponse getInviteLinkDetails(String rawToken) {
        ServerInvite invite = inviteRepository.findByTokenHash(TokenHashUtil.sha256Hex(rawToken))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Invite link not found."));
        requireRedeemable(invite, Instant.now());
        Server server = invite.getServer();
        return new InviteLinkDetailsResponse(
                server.getId(),
                server.getName(),
                server.getGroupImageUrl(),
                invite.getStatus(),
                invite.getExpiresAt(),
                invite.getMaxUses(),
                invite.getUseCount());
    }

    @Transactional
    public JoinServerInviteResponse joinServerByInviteLink(String rawToken, UUID currentUserId) {
        String tokenHash = TokenHashUtil.sha256Hex(rawToken);
        ServerInvite invite = inviteRepository.findByTokenHashForUpdate(tokenHash)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Invite link not found."));

        Instant joinedAt = Instant.now();
        requireRedeemable(invite, joinedAt);
        Server server = findAndLockActiveServer(invite.getServer().getId());
        requireNotActiveMember(server.getId(), currentUserId);
        ServerMembership membership = createMembership(server, findUser(currentUserId), joinedAt);
        eventWriter.writeMembershipCreated(membership);

        recordUse(invite, joinedAt);
        inviteRepository.save(invite);
        return new JoinServerInviteResponse(
                server.getId(),
                server.getName(),
                "Successfully joined the server.");
    }

    private Server findActiveServer(UUID serverId) {
        return serverRepository.findByIdAndDeletedAtIsNull(serverId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, SERVER_NOT_FOUND));
    }

    private Server findAndLockActiveServer(UUID serverId) {
        return serverRepository.findByIdAndDeletedAtIsNullForUpdate(serverId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, SERVER_NOT_FOUND));
    }

    private UserAccount findUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User account not found."));
    }

    private void requireOwner(UUID serverId, UUID userId, String action) {
        boolean owner = membershipRepository.existsByServer_IdAndUser_IdAndRoleAndLeftAtIsNull(
                serverId,
                userId,
                ServerMemberRole.OWNER);
        if (!owner) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only the server owner can " + action + ".");
        }
    }

    private void requireNotActiveMember(UUID serverId, UUID userId) {
        boolean activeMember = membershipRepository
                .findByServer_IdAndUser_IdAndLeftAtIsNull(serverId, userId)
                .isPresent();
        if (activeMember) {
            throw new ApiException(HttpStatus.CONFLICT, "You are already a member of this server.");
        }
    }

    private static void requireRedeemable(ServerInvite invite, Instant now) {
        requireLinkInvite(invite);
        requirePending(invite);
        if (invite.getExpiresAt() != null && !invite.getExpiresAt().isAfter(now)) {
            throw new ApiException(HttpStatus.GONE, "Invite link has expired.");
        }
        if (invite.getMaxUses() == null || invite.getUseCount() >= invite.getMaxUses()) {
            throw new ApiException(HttpStatus.GONE, "Invite link has reached its usage limit.");
        }
    }

    private static void requireLinkInvite(ServerInvite invite) {
        if (invite.getInviteType() != ServerInviteType.LINK) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This invite is not a link invite.");
        }
    }

    private static void requirePending(ServerInvite invite) {
        if (invite.getStatus() != ServerInviteStatus.PENDING) {
            throw new ApiException(HttpStatus.GONE, "Invite link is no longer available.");
        }
    }

    private static void requireRevocable(ServerInvite invite) {
        if (invite.getStatus() != ServerInviteStatus.PENDING) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only pending invite links can be revoked.");
        }
    }

    private ServerMembership createMembership(Server server, UserAccount user, Instant joinedAt) {
        ServerMembership membership = new ServerMembership();
        membership.setServer(server);
        membership.setUser(user);
        membership.setRole(ServerMemberRole.MEMBER);
        membership.setJoinedAt(joinedAt);
        return membershipRepository.save(membership);
    }

    private static void recordUse(ServerInvite invite, Instant usedAt) {
        int updatedUseCount = invite.getUseCount() + 1;
        invite.setUseCount(updatedUseCount);
        if (updatedUseCount == invite.getMaxUses()) {
            invite.setStatus(ServerInviteStatus.ACCEPTED);
            invite.setAcceptedAt(usedAt);
        }
    }

    private static GeneratedInviteLink generateInviteLink(
            Server server,
            UserAccount creator,
            CreateInviteLinkRequest request) {
        Instant createdAt = Instant.now();
        String rawToken = TokenHashUtil.generateToken();
        ServerInvite invite = new ServerInvite();
        invite.setServer(server);
        invite.setCreatedBy(creator);
        invite.setTokenHash(TokenHashUtil.sha256Hex(rawToken));
        invite.setInviteType(ServerInviteType.LINK);
        invite.setStatus(ServerInviteStatus.PENDING);
        invite.setMaxUses(request.maxUses());
        invite.setUseCount(0);
        invite.setCreatedAt(createdAt);
        if (request.expiresInHours() != null) {
            invite.setExpiresAt(createdAt.plus(request.expiresInHours(), ChronoUnit.HOURS));
        }
        return new GeneratedInviteLink(invite, rawToken);
    }

    private InviteLinkResponse toInviteLinkResponse(ServerInvite invite) {
        return new InviteLinkResponse(
                invite.getId(),
                invite.getMaxUses(),
                invite.getUseCount(),
                invite.getExpiresAt(),
                invite.getStatus());
    }

    private record GeneratedInviteLink(ServerInvite invite, String rawToken) {
    }
}
