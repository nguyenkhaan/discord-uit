package com.cloudian.backend.modules.serverinvite.messaging;

import java.time.Instant;
import java.util.UUID;

import com.cloudian.backend.commons.enums.ServerMemberRole;
import com.cloudian.backend.models.ServerMembership;

public record ServerMembershipCreatedEvent(
        UUID membershipId,
        UUID serverId,
        UUID userId,
        ServerMemberRole role,
        Instant joinedAt) {

    public static ServerMembershipCreatedEvent from(ServerMembership membership) {
        return new ServerMembershipCreatedEvent(
                membership.getId(),
                membership.getServer().getId(),
                membership.getUser().getId(),
                membership.getRole(),
                membership.getJoinedAt());
    }
}
