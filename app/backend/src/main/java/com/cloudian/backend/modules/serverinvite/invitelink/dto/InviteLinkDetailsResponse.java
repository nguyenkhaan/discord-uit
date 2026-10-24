package com.cloudian.backend.modules.serverinvite.invitelink.dto;

import java.time.Instant;
import java.util.UUID;

import com.cloudian.backend.commons.enums.ServerInviteStatus;

public record InviteLinkDetailsResponse(
        UUID serverId,
        String serverName,
        String groupImageUrl,
        ServerInviteStatus status,
        Instant expiresAt,
        Integer maxUses,
        int useCount) {
}
