
package com.cloudian.backend.modules.chat.events;

import java.util.UUID;

import com.cloudian.backend.modules.chat.dto.MessageReactionListResponse;

public record MessageReactionChangedEvent(
        UUID serverId,
        MessageReactionListResponse reactionResponse) {
}
