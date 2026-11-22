package com.cloudian.backend.modules.document.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.cloudian.backend.commons.enums.DocumentSubmissionStatus;
import com.cloudian.backend.commons.enums.DocumentVisibilityStatus;
import com.cloudian.backend.commons.enums.MediaStatus;

public record DocumentSubmissionResponse(
        UUID documentId,
        UUID submissionId,
        String title,
        String description,
        String slug,
        String fileName,
        String mimeType,
        Integer sizeBytes,
        List<String> collectionSlugs,
        List<String> tagSlugs,
        String submittedBy,
        DocumentVisibilityStatus visibilityStatus,
        MediaStatus mediaStatus,
        DocumentSubmissionStatus submissionStatus,
        Instant submittedAt,
        Instant reviewedAt,
        String rejectionReason
) {
}
