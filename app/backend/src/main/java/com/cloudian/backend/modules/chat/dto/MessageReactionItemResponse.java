
package com.cloudian.backend.modules.chat.dto;

import java.util.UUID;

import com.cloudian.backend.repositories.MessageReactionRepository.ReactionAggregate;

public record MessageReactionItemResponse(
        UUID iconId,
        String iconImage,
        String name,
        Long count,
        boolean reactedByMe) {

    public static MessageReactionItemResponse from(ReactionAggregate aggregate) {
        Long currentUserCount = aggregate.getCurrentUserReactionCount();

        return new MessageReactionItemResponse(
                aggregate.getIconId(),
                aggregate.getIconImage(),
                aggregate.getName(),
                aggregate.getReactionCount(),
                currentUserCount != null && currentUserCount > 0);
    }
}
