
package com.cloudian.backend.modules.server.dto;

import java.util.List;

public record ChatMessageHistoryResponse(
        List<ChatMessageHistoryItem> messages,
        String nextCursor,
        boolean hasMore) {
}
