
package com.cloudian.backend.modules.chat.dto;

import java.util.List;
import java.util.UUID;

public record MessageReactionListResponse(
        UUID messageId,
        List<MessageReactionItemResponse> reactions) {
}
