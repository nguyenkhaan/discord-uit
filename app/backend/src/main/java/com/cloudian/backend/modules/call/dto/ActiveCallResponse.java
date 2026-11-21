package com.cloudian.backend.modules.call.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Snapshot of the active call in a server, used by the pre-join screen.
 */
public record ActiveCallResponse(
        UUID callSessionId,
        Instant startedAt,
        UUID coordinatorUserId,
        String coordinatorFullName,
        int participantCount,
        int maxParticipants,
        List<Participant> participants,
        UUID activeScreenSharerUserId) {

    public record Participant(UUID userId, String fullName) {
    }
}
