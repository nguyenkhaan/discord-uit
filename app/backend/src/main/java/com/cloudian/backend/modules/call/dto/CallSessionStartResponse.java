package com.cloudian.backend.modules.call.dto;

import java.time.Instant;
import java.util.UUID;

import com.cloudian.backend.commons.enums.CallStatus;

public record CallSessionStartResponse(
        UUID callSessionId,
        String roomName,
        CallStatus status,
        Instant startedAt) {
}