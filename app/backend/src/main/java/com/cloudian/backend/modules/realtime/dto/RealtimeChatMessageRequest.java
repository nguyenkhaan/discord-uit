package com.cloudian.backend.modules.realtime.dto;

import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** contentText được rỗng khi tin có ảnh; service kiểm tra lại */
public record RealtimeChatMessageRequest(
        @NotNull UUID clientRequestId,
        @NotNull @Size(max = 2_000) String contentText,
        UUID replyToMessageId,
        @Size(max = 5) List<UUID> attachmentMediaIds) {

    /** Tin không reply */
    public RealtimeChatMessageRequest(UUID clientRequestId, String contentText) {
        this(clientRequestId, contentText, null, null);
    }

    /** Tin không có ảnh */
    public RealtimeChatMessageRequest(UUID clientRequestId, String contentText, UUID replyToMessageId) {
        this(clientRequestId, contentText, replyToMessageId, null);
    }

    /** Danh sách ảnh, không bao giờ null */
    public List<UUID> attachmentMediaIdsOrEmpty() {
        return attachmentMediaIds == null ? List.of() : attachmentMediaIds;
    }
}
