package com.cloudian.backend.modules.forum.dto;

import java.util.List;

public record ForumPostPageResponse(
        List<ForumPostSummaryResponse> items,
        int page,
        int size,
        long totalElements,
        int totalPages) {
}
