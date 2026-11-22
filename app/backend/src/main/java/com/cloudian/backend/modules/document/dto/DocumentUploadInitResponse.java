package com.cloudian.backend.modules.document.dto;

import java.time.Instant;
import java.util.UUID;

import com.cloudian.backend.commons.enums.DocumentSubmissionStatus;
import com.cloudian.backend.commons.enums.DocumentVisibilityStatus;
import com.cloudian.backend.commons.enums.MediaStatus;

public record DocumentUploadInitResponse(
        UUID documentId,
        UUID submissionId,
        UUID mediaId,
        String uploadUrl,
        Instant uploadUrlExpiresAt,
        String fileName,
        String mimeType,
        Long sizeBytes,
        DocumentVisibilityStatus visibilityStatus,
        MediaStatus mediaStatus,
        DocumentSubmissionStatus submissionStatus
) {
}
