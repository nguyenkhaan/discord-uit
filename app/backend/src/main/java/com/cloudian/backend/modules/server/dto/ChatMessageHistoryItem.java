
package com.cloudian.backend.modules.server.dto;

import java.time.Instant;
import java.util.UUID;

import com.cloudian.backend.models.ChatMessage;

public record ChatMessageHistoryItem(
        UUID messageId,
        UUID senderUserId,
        String contentText,
        Instant createdAt,
        boolean deleted) {

    public static ChatMessageHistoryItem from(ChatMessage message) {
        boolean deleted = message.getDeletedAt() != null;

        return new ChatMessageHistoryItem(
                message.getId(),
                message.getSender().getId(),
                deleted ? null : message.getContentText(),
                message.getCreatedAt(),
                deleted);
    }
}
