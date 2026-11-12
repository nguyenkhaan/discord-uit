
package com.cloudian.backend.modules.server.dto;

import java.time.Instant;
import java.util.UUID;

import com.cloudian.backend.models.ChatMessage;
import com.cloudian.backend.modules.chat.dto.ChatMessageReplyPreview;

public record ChatMessageHistoryItem(
        UUID messageId,
        UUID senderUserId,
        String contentText,
        Instant createdAt,
        boolean deleted,
        ChatMessageReplyPreview replyTo) {

    public static ChatMessageHistoryItem from(ChatMessage message) {
        boolean deleted = message.getDeletedAt() != null;

        return new ChatMessageHistoryItem(
                message.getId(),
                message.getSender().getId(),
                deleted ? null : message.getContentText(),
                message.getCreatedAt(),
                deleted,
                ChatMessageReplyPreview.of(message.getReplyTo()));
    }
}
