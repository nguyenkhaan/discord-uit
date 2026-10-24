package com.cloudian.backend.modules.serverinvite.invitelink.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CreateInviteLinkRequest(
        @NotNull(message = "Maximum uses is required.")
        @Min(value = 1, message = "Maximum uses must be at least 1.")
        Integer maxUses,
        @Min(value = 1, message = "Expiration hours must be at least 1.")
        Integer expiresInHours) {
}
