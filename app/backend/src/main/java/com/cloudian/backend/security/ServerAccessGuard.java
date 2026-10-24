package com.cloudian.backend.security;

import java.util.Optional;
import java.util.UUID;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.cloudian.backend.commons.enums.ServerMemberRole;
import com.cloudian.backend.exceptions.ApiException;
import com.cloudian.backend.repositories.ServerMembershipRepository;

/*
* Use to check role of a member before api endpoints
* */
@Component("serverAccess")
@RequiredArgsConstructor
public class ServerAccessGuard {

    private static final String SERVER_NOT_FOUND_MESSAGE = "Server not found.";

    private final ServerMembershipRepository serverMembershipRepository;

    @Transactional(readOnly = true)
    public boolean isMember(UUID serverId) {
        currentRole(serverId);   // throws 404 when the user is not a member
        return true;
    }

    @Transactional(readOnly = true)
    public boolean isOwner(UUID serverId) {
        return currentRole(serverId) == ServerMemberRole.OWNER;
    }

    private ServerMemberRole currentRole(UUID serverId) {
        if (serverId == null) {
            throw notFound();
        }
        UUID userId = currentUserId();
        Optional<ServerMemberRole> role = serverMembershipRepository.findActiveRole(serverId, userId);
        return role.orElseThrow(ServerAccessGuard::notFound);
    }

    private static UUID currentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails user)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication is required.");
        }
        return user.getUserId();
    }

    private static ApiException notFound() {
        return new ApiException(HttpStatus.NOT_FOUND, SERVER_NOT_FOUND_MESSAGE);
    }
}