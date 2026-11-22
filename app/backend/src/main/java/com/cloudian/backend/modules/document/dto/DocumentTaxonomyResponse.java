package com.cloudian.backend.modules.document.dto;

import java.util.List;
import java.util.UUID;

public record DocumentTaxonomyResponse(
        UUID documentId,
        List<String> collectionSlugs,
        List<String> tagSlugs
) {
}
