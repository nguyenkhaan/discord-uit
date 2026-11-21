package com.cloudian.backend.modules.forum.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.cloudian.backend.commons.enums.ForumPostStatus;

/** Bài của tôi, kèm trạng thái duyệt và lý do từ chối/gỡ */
public record MyForumPostResponse(
        UUID id,
        String title,
        String excerpt,
        List<String> topics,
        boolean anonymous,
        ForumPostStatus status,
        String moderationReason,
        Instant createdAt,
        Instant updatedAt) {
}
