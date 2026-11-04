package com.cloudian.backend.modules.realtime;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.cloudian.backend.commons.enums.ServerMemberRole;
import com.cloudian.backend.exceptions.ApiException;
import com.cloudian.backend.modules.realtime.dto.RealtimeServerAuthorizationResponse;
import com.cloudian.backend.repositories.ServerMembershipRepository;

@Service
public class RealtimeAuthorizationService {

    private static final String SERVER_NOT_FOUND = "Server not found.";

    private final ServerMembershipRepository membershipRepository;

    public RealtimeAuthorizationService(
            ServerMembershipRepository membershipRepository) {
        this.membershipRepository = membershipRepository;
    }

    public RealtimeServerAuthorizationResponse authorizeServer(
            UUID serverId,
            UUID userId) {
        ServerMemberRole role = membershipRepository
                .findActiveRole(serverId, userId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        SERVER_NOT_FOUND));

        return new RealtimeServerAuthorizationResponse(serverId, role);
    }
}
