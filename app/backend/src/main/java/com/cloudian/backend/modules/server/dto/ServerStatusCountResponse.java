package com.cloudian.backend.modules.server.dto;

import com.cloudian.backend.commons.enums.ServerStatus;

public record ServerStatusCountResponse(
        ServerStatus status,
        long serverCount
) {
}
