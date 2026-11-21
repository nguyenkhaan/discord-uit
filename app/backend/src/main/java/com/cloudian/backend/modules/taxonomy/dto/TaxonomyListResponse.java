package com.cloudian.backend.modules.taxonomy.dto;

import java.util.List;

public record TaxonomyListResponse<T>(
        List<T> items,
        int page,
        int size,
        long totalElements,
        int totalPages
) {

    public TaxonomyListResponse {
        items = List.copyOf(items);
    }
}
