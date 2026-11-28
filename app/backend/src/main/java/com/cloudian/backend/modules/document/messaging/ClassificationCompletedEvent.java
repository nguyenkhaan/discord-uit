package com.cloudian.backend.modules.document.messaging;

import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

public record ClassificationCompletedEvent(
        String schemaVersion,
        UUID eventId,
        String classificationRunId,
        UUID documentId,
        UUID submissionId,
        UUID mediaId,
        String modelId,
        String ocrText,
        boolean ocrNeeded,
        List<Suggestion> collectionSuggestions,
        List<Suggestion> tagSuggestions,
        int attempt,
        Instant occurredAt) {

    public ClassificationCompletedEvent {
        schemaVersion = required(schemaVersion, "schemaVersion");
        eventId = Objects.requireNonNull(eventId, "eventId is required.");
        classificationRunId = required(classificationRunId, "classificationRunId");
        documentId = Objects.requireNonNull(documentId, "documentId is required.");
        submissionId = Objects.requireNonNull(submissionId, "submissionId is required.");
        mediaId = Objects.requireNonNull(mediaId, "mediaId is required.");
        modelId = required(modelId, "modelId");
        collectionSuggestions = List.copyOf(
                Objects.requireNonNull(collectionSuggestions, "collectionSuggestions is required."));
        tagSuggestions = List.copyOf(
                Objects.requireNonNull(tagSuggestions, "tagSuggestions is required."));
        if (attempt < 1) {
            throw new IllegalArgumentException("attempt must be positive.");
        }
        occurredAt = Objects.requireNonNull(occurredAt, "occurredAt is required.");
    }

    public record Suggestion(String slug, double confidence) {
    }

    private static String required(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(fieldName + " is required.");
        }
        return value;
    }
}
