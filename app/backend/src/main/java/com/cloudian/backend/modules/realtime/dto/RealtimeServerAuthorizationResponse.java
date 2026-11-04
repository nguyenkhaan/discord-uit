package com.cloudian.backend.modules.realtime.dto;

import java.util.UUID;

import com.cloudian.backend.commons.enums.ServerMemberRole;

public record RealtimeServerAuthorizationResponse(
        UUID serverId,
        ServerMemberRole role) {
}
