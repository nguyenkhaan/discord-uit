package com.cloudian.backend.modules.serverinvite.dto;

import java.time.Instant;
import java.util.UUID;

import com.cloudian.backend.commons.enums.ServerInviteStatus;

public record CreateInviteLinkResponse(
        UUID inviteId,
        String inviteUrl,
        Integer maxUses,
        int useCount,
        Instant expiresAt,
        ServerInviteStatus status) {
}