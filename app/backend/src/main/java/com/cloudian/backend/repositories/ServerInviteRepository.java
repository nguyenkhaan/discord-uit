package com.cloudian.backend.repositories;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cloudian.backend.commons.enums.ServerInviteStatus;
import com.cloudian.backend.commons.enums.ServerInviteType;
import com.cloudian.backend.models.ServerInvite;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;

public interface ServerInviteRepository
        extends JpaRepository<ServerInvite, UUID> {

    Optional<ServerInvite> findByTokenHash(String tokenHash);

    Optional<ServerInvite> findByIdAndServer_Id(
            UUID inviteId,
            UUID serverId);

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

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM ServerInvite i WHERE i.id = :inviteId")
    Optional<ServerInvite> findByIdForUpdate(
            @Param("inviteId") UUID inviteId);
}