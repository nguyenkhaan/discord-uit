package com.cloudian.backend.modules.realtime.dto;

import java.time.Instant;
import java.util.UUID;

import com.cloudian.backend.models.ChatMessage;

public record RealtimeChatMessageResponse(
        UUID messageId,
        UUID serverId,
        UUID senderUserId,
        UUID clientRequestId,
        String contentText,
        Instant createdAt) {

    public static RealtimeChatMessageResponse from(ChatMessage message) {
        return new RealtimeChatMessageResponse(
                message.getId(),
                message.getServer().getId(),
                message.getSender().getId(),
                message.getClientRequestId(),
                message.getContentText(),
                message.getCreatedAt());
    }
}
