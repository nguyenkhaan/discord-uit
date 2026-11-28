package com.cloudian.backend.modules.document.messaging;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

public record ClassificationFailedEvent(
        String schemaVersion,
        UUID eventId,
        String classificationRunId,
        UUID documentId,
        UUID submissionId,
        UUID mediaId,
        String failureCode,
        String failureMessage,
        boolean retryable,
        int attempt,
        Instant occurredAt) {

    public ClassificationFailedEvent {
        schemaVersion = required(schemaVersion, "schemaVersion");
        eventId = Objects.requireNonNull(eventId, "eventId is required.");
        classificationRunId = required(classificationRunId, "classificationRunId");
        documentId = Objects.requireNonNull(documentId, "documentId is required.");
        submissionId = Objects.requireNonNull(submissionId, "submissionId is required.");
        mediaId = Objects.requireNonNull(mediaId, "mediaId is required.");
        failureCode = required(failureCode, "failureCode");
        failureMessage = required(failureMessage, "failureMessage");
        if (attempt < 1) {
            throw new IllegalArgumentException("attempt must be positive.");
        }
        occurredAt = Objects.requireNonNull(occurredAt, "occurredAt is required.");
    }

    private static String required(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(fieldName + " is required.");
        }
        return value;
    }
}
