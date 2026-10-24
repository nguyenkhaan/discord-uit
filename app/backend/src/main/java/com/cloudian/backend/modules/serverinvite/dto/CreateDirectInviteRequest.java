package com.cloudian.backend.modules.serverinvite.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public record CreateDirectInviteRequest(
        @NotNull(message = "Recipient ID is required.") UUID recipientId) {
}