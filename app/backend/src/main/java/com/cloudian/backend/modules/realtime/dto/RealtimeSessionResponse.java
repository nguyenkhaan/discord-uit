package com.cloudian.backend.modules.realtime.dto;

import java.util.UUID;

import com.cloudian.backend.commons.enums.AccountStatus;

public record RealtimeSessionResponse(
        UUID userId,
        UUID sessionId,
        AccountStatus accountStatus) {
}