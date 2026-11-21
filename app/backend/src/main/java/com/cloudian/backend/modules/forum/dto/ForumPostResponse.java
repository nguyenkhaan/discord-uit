package com.cloudian.backend.modules.forum.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.cloudian.backend.commons.enums.ForumPostStatus;

/**
 * Chi tiết bài. content là chuỗi JSON Tiptap.
 * status và moderationReason chỉ có giá trị khi người xem là tác giả.
 */
public record ForumPostResponse(
        UUID id,
        String title,
        String content,
        List<String> topics,
        boolean anonymous,
        String authorName,
        boolean mine,
        ForumPostStatus status,
        String moderationReason,
        Instant createdAt,
        Instant updatedAt) {
}
