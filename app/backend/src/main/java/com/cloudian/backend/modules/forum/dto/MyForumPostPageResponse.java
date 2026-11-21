package com.cloudian.backend.modules.forum.dto;

import java.util.List;

public record MyForumPostPageResponse(
        List<MyForumPostResponse> items,
        int page,
        int size,
        long totalElements,
        int totalPages) {
}
