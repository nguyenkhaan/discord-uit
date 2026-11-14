package com.cloudian.backend.modules.chat.dto;

import java.util.UUID;

import com.cloudian.backend.models.ChatMessage;

/** Nội dung rút gọn của tin được trả lời, hiển thị dạng trích dẫn */
public record ChatMessageReplyPreview(
        UUID messageId,
        UUID senderUserId,
        String contentText,
        boolean deleted) {

    /** Trả về null khi tin không reply */
    public static ChatMessageReplyPreview of(ChatMessage replyTo) {
        if (replyTo == null) {
            return null;
        }
        boolean deleted = replyTo.getDeletedAt() != null;
        return new ChatMessageReplyPreview(
                replyTo.getId(),
                replyTo.getSender().getId(),
                deleted ? null : replyTo.getContentText(),
                deleted);
    }
}
