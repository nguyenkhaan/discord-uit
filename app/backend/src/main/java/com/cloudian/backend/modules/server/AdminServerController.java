package com.cloudian.backend.modules.server;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;
import jakarta.validation.Valid;

import com.cloudian.backend.modules.server.dto.DeleteServerRequest;
import com.cloudian.backend.security.CustomUserDetails;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/servers")
public class AdminServerController {

    private final ServerService serverService;

    @DeleteMapping("/{serverId}/members/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void kickMember(
            @PathVariable("serverId") UUID serverId,
            @PathVariable("userId") UUID userId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        serverService.adminKickMember(
                serverId,
                principal.getUserId(),
                userId);
    }

    @DeleteMapping("/{serverId}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteServer(
            @PathVariable UUID serverId,
            @Valid @RequestBody DeleteServerRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        serverService.adminDeleteServer(
                serverId,
                principal.getUserId(),
                request);
    }
}