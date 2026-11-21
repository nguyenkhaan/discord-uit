package com.cloudian.backend.modules.taxonomy.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.cloudian.backend.models.Collection;

public record CollectionResponse(
        UUID id,
        String name,
        String description,
        String slug,
        List<String> keywords,
        Instant createdAt,
        Instant updatedAt
) {

    public CollectionResponse {
        keywords = List.copyOf(keywords);
    }

    public static CollectionResponse from(Collection collection) {
        return new CollectionResponse(
                collection.getId(),
                collection.getName(),
                collection.getDescription(),
                collection.getSlug(),
                collection.getKeywords() == null ? List.of() : collection.getKeywords(),
                collection.getCreatedAt(),
                collection.getUpdatedAt());
    }
}
