package com.cloudian.backend.modules.notification.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record NotificationListRequest(
        @Min(0) Integer page,
        @Min(1) @Max(MAX_PAGE_SIZE) Integer size
) {
    public static final int DEFAULT_PAGE = 0;
    public static final int DEFAULT_PAGE_SIZE = 20;
    public static final int MAX_PAGE_SIZE = 100;

    public NotificationListRequest {
        page = page == null ? DEFAULT_PAGE : page;
        size = size == null ? DEFAULT_PAGE_SIZE : size;
    }
}
