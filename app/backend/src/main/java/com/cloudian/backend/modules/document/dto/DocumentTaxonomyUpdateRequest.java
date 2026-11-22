package com.cloudian.backend.modules.document.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DocumentTaxonomyUpdateRequest(
        @Size(max = 100) List<@NotBlank @Size(max = 255) String> collectionSlugs,
        @Size(max = 100) List<@NotBlank @Size(max = 255) String> tagSlugs
) {
}
