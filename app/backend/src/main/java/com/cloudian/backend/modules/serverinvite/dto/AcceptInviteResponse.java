package com.cloudian.backend.modules.serverinvite.dto;

import java.time.Instant;
import java.util.UUID;

import com.cloudian.backend.commons.enums.ServerInviteStatus;

public record AcceptInviteResponse(
        UUID inviteId,
        UUID serverId,
        String serverName,
        ServerInviteStatus status,
        Instant acceptedAt,
        String message) {
}