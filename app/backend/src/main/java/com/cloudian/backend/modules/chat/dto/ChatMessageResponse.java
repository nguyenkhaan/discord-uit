// ChatMessageResponse.java
package com.cloudian.backend.modules.chat.dto;

import java.time.Instant;
import java.util.UUID;

import com.cloudian.backend.models.ChatMessage;

/*
* Response trả về cho phía Frontend, khác với RealtimeChatResponse trả về cho Gateway
* */

public record ChatMessageResponse(
        UUID messageId,
        UUID serverId,
        UUID senderUserId,
        UUID clientRequestId,
        String contentText,
        Instant createdAt,
        Instant editedAt,
        Instant deletedAt) {

    public static ChatMessageResponse from(ChatMessage message) {
        boolean deleted = message.getDeletedAt() != null;
        return new ChatMessageResponse(
                message.getId(),
                message.getServer().getId(),
                message.getSender().getId(),
                message.getClientRequestId(),
                deleted ? null : message.getContentText(),
                message.getCreatedAt(),
                message.getEditedAt(),
                message.getDeletedAt());
    }
}