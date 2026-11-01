package com.cloudian.backend.modules.server.dto;

import java.time.Instant;
import java.util.UUID;

import com.cloudian.backend.commons.enums.ServerMemberRole;
import com.cloudian.backend.commons.enums.ServerStatus;
import com.cloudian.backend.models.Server;

public record ServerResponse(
        UUID id,
        String name,
        String groupImageUrl,        // short-lived presigned link, NOT the object key stored in the DB
        ServerMemberRole myRole,
        ServerStatus status,
        long memberCount,
        Instant createdAt
) {

    public static ServerResponse of(Server server, String groupImageUrl,
                                    ServerMemberRole myRole, long memberCount) {
        return new ServerResponse(
                server.getId(),
                server.getName(),
                groupImageUrl,
                myRole,
                server.getStatus(),
                memberCount,
                server.getCreatedAt());
    }
}
