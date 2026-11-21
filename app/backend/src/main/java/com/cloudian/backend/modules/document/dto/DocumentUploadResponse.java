package com.cloudian.backend.modules.document.dto;

import java.time.Instant;
import java.util.UUID;

import com.cloudian.backend.commons.enums.DocumentSubmissionStatus;
import com.cloudian.backend.commons.enums.DocumentVisibilityStatus;
import com.cloudian.backend.commons.enums.MediaStatus;

public record DocumentUploadResponse(
        UUID documentId,
        UUID submissionId,
        UUID mediaId,
        String title,
        String slug,
        String description,
        String fileName,
        String mimeType,
        Integer sizeBytes,
        DocumentVisibilityStatus visibilityStatus,
        MediaStatus mediaStatus,
        DocumentSubmissionStatus submissionStatus,
        Instant submittedAt
) {
}
