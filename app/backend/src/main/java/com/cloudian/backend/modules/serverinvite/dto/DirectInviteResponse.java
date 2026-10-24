package com.cloudian.backend.modules.serverinvite.dto;

import java.time.Instant;
import java.util.UUID;

import com.cloudian.backend.commons.enums.ServerInviteStatus;

public record DirectInviteResponse(
        UUID inviteId,
        UUID serverId,
        UUID recipientId,
        ServerInviteStatus status,
        Instant createdAt) {
}