package com.cloudian.backend.repositories;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cloudian.backend.commons.enums.ServerInviteStatus;
import com.cloudian.backend.commons.enums.ServerInviteType;
import com.cloudian.backend.models.ServerInvite;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;

public interface ServerInviteRepository
        extends JpaRepository<ServerInvite, UUID> {

    Optional<ServerInvite> findByTokenHash(String tokenHash);

    List<ServerInvite> findByServer_IdAndInviteType(
            UUID serverId,
            ServerInviteType inviteType);

    boolean existsByServer_IdAndRecipient_IdAndStatus(
            UUID serverId,
            UUID recipientId,
            ServerInviteStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM ServerInvite i WHERE i.tokenHash = :tokenHash")
    Optional<ServerInvite> findByTokenHashForUpdate(
            @Param("tokenHash") String tokenHash);

    List<ServerInvite> findByRecipient_IdAndInviteTypeAndStatusOrderByCreatedAtDesc(
            UUID recipientId,
            ServerInviteType inviteType,
            ServerInviteStatus status);

    /** Counts link invites that can still be redeemed: pending, not expired and with uses left. */
    @Query("""
            SELECT COUNT(i) FROM ServerInvite i
            WHERE i.server.id = :serverId
              AND i.inviteType = :inviteType
              AND i.status = :status
              AND (i.expiresAt IS NULL OR i.expiresAt > :now)
              AND i.useCount < i.maxUses
            """)
    long countRedeemableInvites(
            @Param("serverId") UUID serverId,
            @Param("inviteType") ServerInviteType inviteType,
            @Param("status") ServerInviteStatus status,
            @Param("now") Instant now);

    /**
     * Closes pending direct invites once the recipient has joined the server another way
     * (e.g. an invite link), so they no longer show Accept/Decline actions.
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
            UPDATE ServerInvite i
            SET i.status = :acceptedStatus, i.acceptedAt = :acceptedAt
            WHERE i.server.id = :serverId
              AND i.recipient.id = :recipientId
              AND i.inviteType = :inviteType
              AND i.status = :pendingStatus
            """)
    int closePendingInvitesForRecipient(
            @Param("serverId") UUID serverId,
            @Param("recipientId") UUID recipientId,
            @Param("inviteType") ServerInviteType inviteType,
            @Param("pendingStatus") ServerInviteStatus pendingStatus,
            @Param("acceptedStatus") ServerInviteStatus acceptedStatus,
            @Param("acceptedAt") Instant acceptedAt);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM ServerInvite i WHERE i.id = :inviteId")
    Optional<ServerInvite> findByIdForUpdate(
            @Param("inviteId") UUID inviteId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT i FROM ServerInvite i
            WHERE i.id = :inviteId AND i.server.id = :serverId
            """)
    Optional<ServerInvite> findByIdAndServerIdForUpdate(
            @Param("inviteId") UUID inviteId,
            @Param("serverId") UUID serverId);
}
