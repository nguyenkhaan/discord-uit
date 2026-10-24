package com.cloudian.backend.modules.notification.messaging;

import java.time.Instant;
import java.util.UUID;

import com.cloudian.backend.commons.enums.NotificationKind;
import com.cloudian.backend.models.Notification;

public record NotificationCreatedEvent(
        UUID notificationId,
        UUID recipientUserId,
        UUID actorUserId,
        NotificationKind kind,
        String content,
        String relatedEntityType,
        UUID relatedEntityId,
        Instant createdAt
) {

    public static NotificationCreatedEvent from(Notification notification) {
        UUID actorUserId = notification.getActor() == null ? null : notification.getActor().getId();
        return new NotificationCreatedEvent(
                notification.getId(),
                notification.getRecipient().getId(),
                actorUserId,
                notification.getKind(),
                notification.getContent(),
                notification.getRelatedEntityType(),
                notification.getRelatedEntityId(),
                notification.getCreatedAt());
    }
}
