package com.cloudian.backend.modules.serverinvite.dto;

import java.time.Instant;
import java.util.UUID;

import com.cloudian.backend.commons.enums.ServerInviteStatus;

public record MyDirectInviteResponse(
        UUID inviteId,
        UUID serverId,
        String serverName,
        String invitedBy,
        ServerInviteStatus status,
        Instant createdAt) {
}