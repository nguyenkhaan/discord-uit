package com.cloudian.backend.modules.taxonomy.dto;

import java.util.UUID;

import com.cloudian.backend.models.Tag;

public record TagResponse(
        UUID id,
        String name,
        String slug,
        String description
) {

    public static TagResponse from(Tag tag) {
        return new TagResponse(tag.getId(), tag.getName(), tag.getSlug(), tag.getDescription());
    }
}
