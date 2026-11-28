package com.cloudian.backend.modules.document.dto;

import java.time.Instant;
import java.util.List;

public record ClassificationSuggestionResponse(
        String classificationRunId,
        String modelId,
        String ocrText,
        List<Suggestion> collectionSuggestions,
        List<Suggestion> tagSuggestions,
        Instant createdAt) {

    public ClassificationSuggestionResponse {
        collectionSuggestions = List.copyOf(collectionSuggestions);
        tagSuggestions = List.copyOf(tagSuggestions);
    }

    public record Suggestion(String slug, double confidence) {
    }
}
