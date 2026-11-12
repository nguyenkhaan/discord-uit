package com.cloudian.backend.modules.realtime.dto;

import java.time.Instant;
import java.util.UUID;

import com.cloudian.backend.models.ChatMessage;
import com.cloudian.backend.modules.chat.dto.ChatMessageReplyPreview;

public record RealtimeChatMessageResponse(
        UUID messageId,
        UUID serverId,
        UUID senderUserId,
        UUID clientRequestId,
        String contentText,
        Instant createdAt,
        ChatMessageReplyPreview replyTo) {

    /** Tin không reply */
    public RealtimeChatMessageResponse(
            UUID messageId,
            UUID serverId,
            UUID senderUserId,
            UUID clientRequestId,
            String contentText,
            Instant createdAt) {
        this(messageId, serverId, senderUserId, clientRequestId, contentText, createdAt, null);
    }

    public static RealtimeChatMessageResponse from(ChatMessage message) {
        return new RealtimeChatMessageResponse(
                message.getId(),
                message.getServer().getId(),
                message.getSender().getId(),
                message.getClientRequestId(),
                message.getContentText(),
                message.getCreatedAt(),
                ChatMessageReplyPreview.of(message.getReplyTo()));
    }
}
