package com.cloudian.backend.repositories;

import java.util.Optional;
import java.util.UUID;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;

import com.cloudian.backend.models.ChatMessage;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {

    Optional<ChatMessage> findByServer_IdAndSender_IdAndClientRequestId(
            UUID serverId,
            UUID senderUserId,
            UUID clientRequestId);

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
