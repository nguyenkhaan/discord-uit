package com.cloudian.backend.modules.forum.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Bài trong danh sách công khai; bài ẩn danh không có thông tin tác giả */
public record ForumPostSummaryResponse(
        UUID id,
        String title,
        String excerpt,
        List<String> topics,
        boolean anonymous,
        String authorName,
        boolean mine,
        Instant createdAt) {
}
