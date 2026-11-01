package com.cloudian.backend.modules.server;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.cloudian.backend.commons.enums.ServerMemberRole;
import com.cloudian.backend.commons.enums.SystemRole;
import com.cloudian.backend.exceptions.ApiException;
import com.cloudian.backend.exceptions.StorageException;
import com.cloudian.backend.models.Server;
import com.cloudian.backend.models.ServerMembership;
import com.cloudian.backend.models.UserAccount;
import com.cloudian.backend.modules.server.dto.CreateServerRequest;
import com.cloudian.backend.modules.server.dto.ServerMemberResponse;
import com.cloudian.backend.modules.server.dto.ServerResponse;
import com.cloudian.backend.repositories.ServerMembershipRepository;
import com.cloudian.backend.repositories.ServerRepository;
import com.cloudian.backend.repositories.UserAccountRepository;
import com.cloudian.backend.services.ImageUploadService;
import com.cloudian.backend.services.StorageService;
import com.cloudian.backend.commons.enums.MembershipEndReason;

/**
 * Server module. Permission checks (member / owner) are done BEFORE these
 * methods
 * by @PreAuthorize + ServerAccessGuard in the controller.
 *
 * server.group_image_url stores the MinIO OBJECT KEY (e.g.
 * "server-images/<uuid>.png"),
 * never a public link: responses turn it into a short-lived presigned URL.
 */
@Service
public class ServerService {

    private static final Logger LOGGER = LoggerFactory.getLogger(ServerService.class);

    private static final String SERVER_IMAGE_FOLDER = "server-images";
    private static final String SERVER_NOT_FOUND_MESSAGE = "Server not found.";

    private final ServerRepository serverRepository;
    private final ServerMembershipRepository serverMembershipRepository;
    private final UserAccountRepository userAccountRepository;
    private final ImageUploadService imageUploadService;
    private final StorageService storageService;

    public ServerService(
            ServerRepository serverRepository,
            ServerMembershipRepository serverMembershipRepository,
            UserAccountRepository userAccountRepository,
            ImageUploadService imageUploadService,
            StorageService storageService) {
        this.serverRepository = serverRepository;
        this.serverMembershipRepository = serverMembershipRepository;
        this.userAccountRepository = userAccountRepository;
        this.imageUploadService = imageUploadService;
        this.storageService = storageService;
    }

    @Transactional
    public ServerResponse create(UUID userId, CreateServerRequest request) {
        String imageKey = request.hasImage()
                ? imageUploadService.uploadImage(request.image(), SERVER_IMAGE_FOLDER)
                : null;
        if (imageKey != null) {
            deleteImageIfRolledBack(imageKey);
        }

        UserAccount creator = userAccountRepository.getReferenceById(userId);

        Server server = new Server();
        server.setName(request.name().trim());
        server.setGroupImageUrl(imageKey);
        server.setCreatedBy(creator);
        serverRepository.save(server);

        ServerMembership ownerMembership = new ServerMembership();
        ownerMembership.setServer(server);
        ownerMembership.setUser(creator);
        ownerMembership.setRole(ServerMemberRole.OWNER);
        ownerMembership.setJoinedAt(Instant.now());
        serverMembershipRepository.save(ownerMembership);

        return ServerResponse.of(server, imageUrl(imageKey), ServerMemberRole.OWNER, 1);
    }

    @Transactional(readOnly = true)
    public List<ServerResponse> listMine(UUID userId) {
        List<ServerMembership> memberships = serverMembershipRepository.findActiveByUserId(userId);
        if (memberships.isEmpty()) {
            return List.of();
        }

        List<UUID> serverIds = memberships.stream()
                .map(membership -> membership.getServer().getId())
                .toList();
        Map<UUID, Long> memberCounts = serverMembershipRepository.countActiveByServerIds(serverIds).stream()
                .collect(Collectors.toMap(ServerMemberCount::serverId, ServerMemberCount::totalMember));

        return memberships.stream()
                .map(membership -> {
                    Server server = membership.getServer();
                    return ServerResponse.of(
                            server,
                            imageUrl(server.getGroupImageUrl()),
                            membership.getRole(),
                            memberCounts.getOrDefault(server.getId(), 0L));
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public ServerResponse get(UUID serverId, UUID userId) {
        Server server = serverRepository.findById(serverId)
                .orElseThrow(ServerService::notFound);
        ServerMemberRole myRole = serverMembershipRepository.findActiveRole(serverId, userId)
                .orElseThrow(ServerService::notFound);
        long memberCount = serverMembershipRepository.countByServerIdAndLeftAtIsNull(serverId);

        return ServerResponse.of(server, imageUrl(server.getGroupImageUrl()), myRole, memberCount);
    }

    @Transactional(readOnly = true)
    public List<ServerMemberResponse> listMembers(UUID serverId) {
        return serverMembershipRepository.findActiveByServerId(serverId).stream()
                .map(ServerMemberResponse::from)
                .toList();
    }

    private String imageUrl(String objectKey) {
        if (objectKey == null || objectKey.isBlank()) {
            return null;
        }
        try {
            return storageService.presignedGetUrl(objectKey);
        } catch (StorageException exception) {
            LOGGER.warn("Could not create the image link for {}", objectKey, exception);
            return null;
        }
    }

    // use this when Image is upload but the transaction is not committed
    private void deleteImageIfRolledBack(String objectKey) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status != STATUS_COMMITTED) {
                    storageService.delete(objectKey);
                }
            }
        });
    }

    private static ApiException notFound() {
        return new ApiException(HttpStatus.NOT_FOUND, SERVER_NOT_FOUND_MESSAGE);
    }

    @Transactional
    public void promoteMember(UUID serverId, UUID currentUserId, UUID targetUserId) {

        // 1. Lock server to serialize membership changes
        serverRepository.findByIdAndDeletedAtIsNullForUpdate(serverId)
                .orElseThrow(ServerService::notFound);

        // 2. Verify current user is an owner
        boolean isOwner = serverMembershipRepository
                .existsByServer_IdAndUser_IdAndRoleAndLeftAtIsNull(
                        serverId,
                        currentUserId,
                        ServerMemberRole.OWNER);

        if (!isOwner) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "Only server owners can promote members.");
        }

        // 3. Find target active membership
        ServerMembership targetMembership = serverMembershipRepository
                .findByServer_IdAndUser_IdAndLeftAtIsNull(
                        serverId,
                        targetUserId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Active membership not found."));

        // 4. Target must be a MEMBER
        if (targetMembership.getRole() != ServerMemberRole.MEMBER) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Only active members can be promoted to owner.");
        }

        // 5. Promote
        targetMembership.setRole(ServerMemberRole.OWNER);
    }

    @Transactional
    public void kickMember(
            UUID serverId,
            UUID currentUserId,
            UUID targetUserId) {
        // 1. Lock server
        serverRepository.findByIdAndDeletedAtIsNullForUpdate(serverId)
                .orElseThrow(ServerService::notFound);

        // 2. Verify current user is an owner
        boolean isOwner = serverMembershipRepository
                .existsByServer_IdAndUser_IdAndRoleAndLeftAtIsNull(
                        serverId,
                        currentUserId,
                        ServerMemberRole.OWNER);

        if (!isOwner) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "Only server owners can kick members.");
        }

        // 3. Prevent kicking yourself
        if (currentUserId.equals(targetUserId)) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "You cannot kick yourself. Use leave instead.");
        }

        // 4. Find target active membership
        ServerMembership targetMembership = serverMembershipRepository
                .findByServer_IdAndUser_IdAndLeftAtIsNull(
                        serverId,
                        targetUserId)
                .orElseThrow(ServerService::notFound);
        if (targetMembership.getRole() != ServerMemberRole.MEMBER) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Owner cannot be kicked before owner continuity is handled.");
        }
        // 5. End membership
        endMembership(
                targetMembership,
                MembershipEndReason.KICKED,
                currentUserId);
    }

    @Transactional
    public void adminKickMember(
            UUID serverId,
            UUID adminUserId,
            UUID targetUserId) {
        // 1. Lock server
        serverRepository.findByIdAndDeletedAtIsNullForUpdate(serverId)
                .orElseThrow(ServerService::notFound);

        // 2. Verify system admin
        UserAccount admin = userAccountRepository.getReferenceById(adminUserId);

        if (admin.getSystemRole() != SystemRole.ADMIN) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "Only system admins can kick members through this endpoint.");
        }

        // 3. Prevent kicking yourself
        if (adminUserId.equals(targetUserId)) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "You cannot kick yourself.");
        }

        // 4. Find target active membership
        ServerMembership targetMembership = serverMembershipRepository
                .findByServer_IdAndUser_IdAndLeftAtIsNull(
                        serverId,
                        targetUserId)
                .orElseThrow(ServerService::notFound);

        // 5. Handle owner continuity if target is an OWNER
        ensureOwnerContinuity(serverId, targetMembership);

        // 6. End membership
        endMembership(
                targetMembership,
                MembershipEndReason.KICKED,
                adminUserId);
    }

    private void endMembership(
            ServerMembership membership,
            MembershipEndReason reason,
            UUID endedByUserId) {
        membership.setLeftAt(Instant.now());
        membership.setEndedReason(reason);

        if (endedByUserId != null) {
            membership.setEndedBy(
                    userAccountRepository.getReferenceById(endedByUserId));
        } else {
            membership.setEndedBy(null);
        }
    }

    private void ensureOwnerContinuity(
            UUID serverId,
            ServerMembership departingMembership) {
        // 1. Only handle OWNER membership
        if (departingMembership.getRole() != ServerMemberRole.OWNER) {
            return;
        }

        // 2. Check active owner count
        long activeOwnerCount = serverMembershipRepository
                .countByServer_IdAndRoleAndLeftAtIsNull(
                        serverId,
                        ServerMemberRole.OWNER);

        // 3. Another owner still exists
        if (activeOwnerCount > 1) {
            return;
        }

        // 4. Find the oldest active MEMBER
        ServerMembership successor = serverMembershipRepository
                .findFirstByServer_IdAndRoleAndLeftAtIsNullOrderByJoinedAtAscIdAsc(
                        serverId,
                        ServerMemberRole.MEMBER)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.CONFLICT,
                        "Cannot remove the last owner because the server has no other active members."));

        // 5. Promote successor
        successor.setRole(ServerMemberRole.OWNER);
    }

    @Transactional
    public void leaveServer(UUID serverId, UUID currentUserId) {

        // 1. Lock server
        serverRepository.findByIdAndDeletedAtIsNullForUpdate(serverId)
                .orElseThrow(ServerService::notFound);

        // 2. Find current user's active membership
        ServerMembership membership = serverMembershipRepository
                .findByServer_IdAndUser_IdAndLeftAtIsNull(
                        serverId,
                        currentUserId)
                .orElseThrow(ServerService::notFound);

        // 3. Handle owner continuity if current user is OWNER
        ensureOwnerContinuity(serverId, membership);

        // 4. End membership as LEFT
        endMembership(
                membership,
                MembershipEndReason.LEFT,
                null);
    }

}