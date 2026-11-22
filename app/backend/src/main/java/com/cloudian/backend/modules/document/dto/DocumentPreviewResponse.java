package com.cloudian.backend.modules.document.dto;

import java.util.UUID;

import com.cloudian.backend.commons.enums.DocumentSubmissionStatus;

public record DocumentPreviewResponse(
        UUID documentId,
        UUID submissionId,
        String title,
        String fileName,
        String mimeType,
        Integer sizeBytes,
        DocumentSubmissionStatus submissionStatus,
        String previewUrl,
        String downloadUrl
) {
}
