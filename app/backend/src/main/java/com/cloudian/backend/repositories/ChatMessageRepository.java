
package com.cloudian.backend.repositories;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.cloudian.backend.models.ChatMessage;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {

    Optional<ChatMessage> findByServer_IdAndSender_IdAndClientRequestId(
            UUID serverId,
            UUID senderUserId,
            UUID clientRequestId);

    @Query("""
            SELECT m
            FROM ChatMessage m
            WHERE m.server.id = :serverId
            ORDER BY m.createdAt DESC, m.id DESC
            """)
    List<ChatMessage> findLatestByServerId(
            @Param("serverId") UUID serverId,
            Pageable pageable);

    @Query("""
            SELECT m
            FROM ChatMessage m
            WHERE m.server.id = :serverId
              AND (
                    m.createdAt < :beforeCreatedAt
                    OR (
                        m.createdAt = :beforeCreatedAt
                        AND m.id < :beforeId
                    )
              )
            ORDER BY m.createdAt DESC, m.id DESC
            """)
    List<ChatMessage> findBeforeCursor(
            @Param("serverId") UUID serverId,
            @Param("beforeCreatedAt") Instant beforeCreatedAt,
            @Param("beforeId") UUID beforeId,
            Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select m
              from ChatMessage m
             where m.id = :messageId
               and m.server.id = :serverId
            """)
    Optional<ChatMessage> findByIdAndServerIdForUpdate(
            @Param("serverId") UUID serverId,
            @Param("messageId") UUID messageId);
}
