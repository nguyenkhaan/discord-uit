package com.cloudian.backend.modules.serverinvite.dto;

import java.util.UUID;

public record JoinServerInviteResponse(
        UUID serverId,
        String serverName,
        String message) {
}