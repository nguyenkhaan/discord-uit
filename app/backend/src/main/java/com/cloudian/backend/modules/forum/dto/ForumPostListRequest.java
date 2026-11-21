package com.cloudian.backend.modules.forum.dto;

import java.util.List;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

/** Tìm bài: q theo tiêu đề, topics khớp một trong các chủ đề */
public record ForumPostListRequest(
        @Min(0) Integer page,
        @Min(1) @Max(MAX_PAGE_SIZE) Integer size,
        @Size(max = 100) String q,
        List<String> topics) {

    public static final int DEFAULT_PAGE_SIZE = 20;
    public static final int MAX_PAGE_SIZE = 50;

    public ForumPostListRequest {
        page = page == null ? 0 : page;
        size = size == null ? DEFAULT_PAGE_SIZE : size;
        q = q == null ? "" : q.strip();
        topics = topics == null ? List.of() : topics;
    }
}
