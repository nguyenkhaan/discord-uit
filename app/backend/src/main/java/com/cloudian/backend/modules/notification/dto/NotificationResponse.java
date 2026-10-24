package com.cloudian.backend.modules.notification.dto;

import java.time.Instant;
import java.util.UUID;

import com.cloudian.backend.commons.enums.NotificationKind;
import com.cloudian.backend.models.Notification;

/** A recipient-scoped notification. Deleted notifications are never mapped to this response. */
public record NotificationResponse(
        UUID id,
        UUID actorUserId,
        NotificationKind kind,
        String content,
        String relatedEntityType,
        UUID relatedEntityId,
        Instant readAt,
        Instant createdAt
) {

    public static NotificationResponse from(Notification notification) {
        UUID actorUserId = notification.getActor() == null ? null : notification.getActor().getId();

        return new NotificationResponse(
                notification.getId(),
                actorUserId,
                notification.getKind(),
                notification.getContent(),
                notification.getRelatedEntityType(),
                notification.getRelatedEntityId(),
                notification.getReadAt(),
                notification.getCreatedAt());
    }
}
