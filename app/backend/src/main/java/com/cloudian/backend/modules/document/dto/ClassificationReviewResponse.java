package com.cloudian.backend.modules.document.dto;

import java.time.Instant;
import java.util.List;

import com.cloudian.backend.commons.enums.ClassificationRunStatus;

public record ClassificationReviewResponse(
        String classificationRunId,
        ClassificationRunStatus status,
        int attemptCount,
        String modelId,
        boolean ocrNeeded,
        String ocrText,
        String failureCode,
        String failureMessage,
        Instant queuedAt,
        Instant startedAt,
        Instant completedAt,
        Instant createdAt,
        List<Suggestion> collectionSuggestions,
        List<Suggestion> tagSuggestions) {

    public ClassificationReviewResponse {
        collectionSuggestions = List.copyOf(collectionSuggestions);
        tagSuggestions = List.copyOf(tagSuggestions);
    }

    public record Suggestion(String slug, double confidence) {
    }
}
