package com.cloudian.backend.modules.server.dto;

import com.cloudian.backend.commons.enums.ServerStatus;

import jakarta.validation.constraints.NotNull;

public record UpdateServerStatusRequest(
        @NotNull ServerStatus status
) {
}
