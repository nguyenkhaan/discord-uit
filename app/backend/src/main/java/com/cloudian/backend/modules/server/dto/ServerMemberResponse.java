package com.cloudian.backend.modules.server.dto;

import java.time.Instant;
import java.util.UUID;

import com.cloudian.backend.commons.enums.ServerMemberRole;
import com.cloudian.backend.models.ServerMembership;
import com.fasterxml.jackson.annotation.JsonProperty;

public record ServerMemberResponse(
        UUID userId,
        String fullName,
        ServerMemberRole role,
        @JsonProperty("isOwner") boolean isOwner,
        Instant joinedAt
) {

    public static ServerMemberResponse from(ServerMembership membership) {
        return new ServerMemberResponse(
                membership.getUser().getId(),
                membership.getUser().getFullName(),
                membership.getRole(),
                membership.getRole() == ServerMemberRole.OWNER,
                membership.getJoinedAt());
    }
}