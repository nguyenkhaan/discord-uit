package com.cloudian.backend.repositories;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cloudian.backend.models.ChatMessage;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {

    Optional<ChatMessage> findByServer_IdAndSender_IdAndClientRequestId(
            UUID serverId,
            UUID senderUserId,
            UUID clientRequestId);
}
