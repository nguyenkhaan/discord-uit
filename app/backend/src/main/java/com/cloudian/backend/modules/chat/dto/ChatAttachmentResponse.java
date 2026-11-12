package com.cloudian.backend.modules.chat.dto;

import java.util.UUID;

/** Ảnh đính kèm; url là link tạm để xem ảnh, null khi không tạo được link */
public record ChatAttachmentResponse(
        UUID mediaId,
        String url,
        String fileName,
        String mimeType,
        Integer sizeBytes) {
}
