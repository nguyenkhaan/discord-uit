package com.cloudian.backend.modules.serverinvite.directinvite;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

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
import com.cloudian.backend.modules.notification.NotificationService;
import com.cloudian.backend.modules.serverinvite.directinvite.dto.AcceptInviteResponse;
import com.cloudian.backend.modules.serverinvite.directinvite.dto.CreateDirectInviteRequest;
import com.cloudian.backend.modules.serverinvite.directinvite.dto.DeclineInviteResponse;
import com.cloudian.backend.modules.serverinvite.directinvite.dto.DirectInviteResponse;
import com.cloudian.backend.modules.serverinvite.directinvite.dto.MyDirectInviteResponse;
import com.cloudian.backend.modules.serverinvite.messaging.ServerInviteEventWriter;
import com.cloudian.backend.repositories.ServerInviteRepository;
import com.cloudian.backend.repositories.ServerMembershipRepository;
import com.cloudian.backend.repositories.ServerRepository;
import com.cloudian.backend.repositories.UserAccountRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DirectInviteService {

    private static final String INVITE_NOT_FOUND = "Invite not found.";
    private static final String SERVER_NOT_FOUND = "Server not found.";

    private final ServerInviteRepository inviteRepository;
    private final ServerRepository serverRepository;
    private final ServerMembershipRepository membershipRepository;
    private final UserAccountRepository userRepository;
    private final NotificationService notificationService;
    private final ServerInviteEventWriter eventWriter;

    @Transactional
    public DirectInviteResponse createDirectInvite(
            UUID serverId,
            UUID currentUserId,
            CreateDirectInviteRequest request) {
        Server server = findAndLockActiveServer(serverId);
        requireOwner(serverId, currentUserId);

        UserAccount recipient = userRepository.findById(request.recipientId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Recipient user not found."));
        requireNotActiveMember(
                serverId,
                recipient.getId(),
                "Recipient is already a member of this server.");
        requireNoPendingInvite(serverId, recipient.getId());

        UserAccount creator = findUser(currentUserId);
        ServerInvite savedInvite = inviteRepository.save(newDirectInvite(server, creator, recipient));
        notificationService.createServerInvitationNotification(
                creator,
                recipient,
                savedInvite.getId(),
                server.getName());

        return new DirectInviteResponse(
                savedInvite.getId(),
                server.getId(),
                recipient.getId(),
                savedInvite.getStatus(),
                savedInvite.getCreatedAt());
    }

    @Transactional(readOnly = true)
    public List<MyDirectInviteResponse> getMyDirectInvites(UUID currentUserId) {
        return inviteRepository
                .findByRecipient_IdAndInviteTypeAndStatusOrderByCreatedAtDesc(
                        currentUserId,
                        ServerInviteType.DIRECT,
                        ServerInviteStatus.PENDING)
                .stream()
                .map(this::toPendingInviteResponse)
                .toList();
    }

    @Transactional
    public AcceptInviteResponse acceptDirectInvite(UUID inviteId, UUID currentUserId) {
        ServerInvite invite = findLockedInvite(inviteId);
        requireRecipient(invite, currentUserId);
        requireDirectInvite(invite);
        requirePending(invite);

        Instant acceptedAt = Instant.now();
        requireNotExpired(invite, acceptedAt);
        Server server = findAndLockActiveServer(invite.getServer().getId());
        requireNotActiveMember(
                server.getId(),
                currentUserId,
                "You are already a member of this server.");

        ServerMembership membership = createMembership(server, findUser(currentUserId), acceptedAt);
        eventWriter.writeMembershipCreated(membership);

        invite.setStatus(ServerInviteStatus.ACCEPTED);
        invite.setAcceptedAt(acceptedAt);
        inviteRepository.save(invite);

        return new AcceptInviteResponse(
                invite.getId(),
                server.getId(),
                server.getName(),
                invite.getStatus(),
                invite.getAcceptedAt(),
                "Invite accepted successfully.");
    }

    @Transactional
    public DeclineInviteResponse declineDirectInvite(UUID inviteId, UUID currentUserId) {
        ServerInvite invite = findLockedInvite(inviteId);
        requireRecipient(invite, currentUserId);
        requireDirectInvite(invite);
        requirePending(invite);

        Instant declinedAt = Instant.now();
        requireNotExpired(invite, declinedAt);
        invite.setStatus(ServerInviteStatus.DECLINED);
        invite.setDeclinedAt(declinedAt);
        inviteRepository.save(invite);

        return new DeclineInviteResponse(
                invite.getId(),
                invite.getStatus(),
                invite.getDeclinedAt(),
                "Invite declined successfully.");
    }

    private Server findAndLockActiveServer(UUID serverId) {
        return serverRepository.findByIdAndDeletedAtIsNullForUpdate(serverId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, SERVER_NOT_FOUND));
    }

    private UserAccount findUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User account not found."));
    }

    private ServerInvite findLockedInvite(UUID inviteId) {
        return inviteRepository.findByIdForUpdate(inviteId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, INVITE_NOT_FOUND));
    }

    private void requireOwner(UUID serverId, UUID userId) {
        boolean owner = membershipRepository.existsByServer_IdAndUser_IdAndRoleAndLeftAtIsNull(
                serverId,
                userId,
                ServerMemberRole.OWNER);
        if (!owner) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only the server owner can send direct invites.");
        }
    }

    private void requireNotActiveMember(UUID serverId, UUID userId, String errorMessage) {
        boolean activeMember = membershipRepository
                .findByServer_IdAndUser_IdAndLeftAtIsNull(serverId, userId)
                .isPresent();
        if (activeMember) {
            throw new ApiException(HttpStatus.CONFLICT, errorMessage);
        }
    }

    private void requireNoPendingInvite(UUID serverId, UUID recipientId) {
        boolean pendingInvite = inviteRepository.existsByServer_IdAndRecipient_IdAndStatus(
                serverId,
                recipientId,
                ServerInviteStatus.PENDING);
        if (pendingInvite) {
            throw new ApiException(HttpStatus.CONFLICT, "A pending invite already exists for this user.");
        }
    }

    private static void requireRecipient(ServerInvite invite, UUID currentUserId) {
        if (invite.getRecipient() == null || !invite.getRecipient().getId().equals(currentUserId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You are not allowed to act on this invite.");
        }
    }

    private static void requireDirectInvite(ServerInvite invite) {
        if (invite.getInviteType() != ServerInviteType.DIRECT) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This is not a direct invite.");
        }
    }

    private static void requirePending(ServerInvite invite) {
        if (invite.getStatus() != ServerInviteStatus.PENDING) {
            throw new ApiException(HttpStatus.CONFLICT, "This invite is no longer pending.");
        }
    }

    private static void requireNotExpired(ServerInvite invite, Instant now) {
        if (invite.getExpiresAt() != null && !invite.getExpiresAt().isAfter(now)) {
            throw new ApiException(HttpStatus.GONE, "Invite has expired.");
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

    private static ServerInvite newDirectInvite(
            Server server,
            UserAccount creator,
            UserAccount recipient) {
        ServerInvite invite = new ServerInvite();
        invite.setServer(server);
        invite.setCreatedBy(creator);
        invite.setRecipient(recipient);
        invite.setInviteType(ServerInviteType.DIRECT);
        invite.setStatus(ServerInviteStatus.PENDING);
        invite.setUseCount(0);
        invite.setCreatedAt(Instant.now());
        return invite;
    }

    private MyDirectInviteResponse toPendingInviteResponse(ServerInvite invite) {
        return new MyDirectInviteResponse(
                invite.getId(),
                invite.getServer().getId(),
                invite.getServer().getName(),
                invite.getCreatedBy().getEmail(),
                invite.getStatus(),
                invite.getCreatedAt());
    }
}
