
package com.cloudian.backend.modules.call.dto;

import java.time.Instant;
import java.util.UUID;

import com.cloudian.backend.commons.enums.CallEventType;
import com.cloudian.backend.models.CallEvent;

public record CallEventResponse(
        UUID eventId,
        UUID actorUserId,
        String actorFullName,
        UUID targetUserId,
        String targetFullName,
        CallEventType eventType,
        Instant createdAt) {

    public static CallEventResponse from(CallEvent event) {

        return new CallEventResponse(
                event.getId(),
                event.getActor().getId(),
                event.getActor().getFullName(),
                event.getTarget() != null
                        ? event.getTarget().getId()
                        : null,
                event.getTarget() != null
                        ? event.getTarget().getFullName()
                        : null,
                event.getEventType(),
                event.getCreatedAt());
    }
}
