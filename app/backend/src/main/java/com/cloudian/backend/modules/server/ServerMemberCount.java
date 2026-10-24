package com.cloudian.backend.modules.server;

import java.util.UUID;

public record ServerMemberCount(
        UUID serverId,
        long totalMember
) {
}
