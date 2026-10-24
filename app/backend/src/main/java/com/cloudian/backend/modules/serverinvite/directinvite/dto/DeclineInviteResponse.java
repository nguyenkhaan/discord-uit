package com.cloudian.backend.modules.serverinvite.directinvite.dto;

import java.time.Instant;
import java.util.UUID;

import com.cloudian.backend.commons.enums.ServerInviteStatus;

public record DeclineInviteResponse(
        UUID inviteId,
        ServerInviteStatus status,
        Instant declinedAt,
        String message) {
}
