package com.cloudian.backend.modules.server;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.cloudian.backend.modules.server.dto.CreateServerRequest;
import com.cloudian.backend.modules.server.dto.ServerMemberResponse;
import com.cloudian.backend.modules.server.dto.ServerResponse;
import com.cloudian.backend.modules.server.dto.ServerStatusCountResponse;
import com.cloudian.backend.modules.server.dto.UpdateServerStatusRequest;
import com.cloudian.backend.commons.enums.ServerStatus;
import com.cloudian.backend.security.CustomUserDetails;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/servers")
public class ServerController {

    private final ServerService serverService;

    public ServerController(ServerService serverService) {
        this.serverService = serverService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ServerResponse create(@AuthenticationPrincipal CustomUserDetails principal,
            @Valid @ModelAttribute CreateServerRequest request) {
        return serverService.create(principal.getUserId(), request);
    }

    @GetMapping
    public List<ServerResponse> listMine(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestParam(name = "status", required = false) Set<ServerStatus> statuses) {
        return serverService.listMine(principal.getUserId(), statuses);
    }

    @GetMapping("/status-counts")
    public List<ServerStatusCountResponse> countMineByStatus(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestParam(name = "status", required = false) Set<ServerStatus> statuses) {
        return serverService.countMineByStatus(principal.getUserId(), statuses);
    }

    @GetMapping("/{serverId}")
    @PreAuthorize("@serverAccess.isMember(#serverId)")
    public ServerResponse get(@AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable("serverId") UUID serverId) {
        return serverService.get(serverId, principal.getUserId());
    }

    @GetMapping("/{serverId}/members")
    @PreAuthorize("@serverAccess.isMember(#serverId)")
    public List<ServerMemberResponse> listMembers(@PathVariable("serverId") UUID serverId) {
        return serverService.listMembers(serverId);
    }

    @PatchMapping("/{serverId}/status")
    @PreAuthorize("@serverAccess.isOwner(#serverId)")
    public ServerResponse updateStatus(
            @PathVariable("serverId") UUID serverId,
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody UpdateServerStatusRequest request) {
        return serverService.updateStatus(serverId, principal.getUserId(), request.status());
    }

    @PostMapping("/{serverId}/members/{userId}/promote")
    @PreAuthorize("@serverAccess.isOwner(#serverId)")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void promoteMember(
            @PathVariable("serverId") UUID serverId,
            @PathVariable("userId") UUID userId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        serverService.promoteMember(
                serverId,
                principal.getUserId(),
                userId);
    }

    @DeleteMapping("/{serverId}/members/{userId}")
    @PreAuthorize("@serverAccess.isOwner(#serverId)")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void kickMember(
            @PathVariable("serverId") UUID serverId,
            @PathVariable("userId") UUID userId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        serverService.kickMember(
                serverId,
                principal.getUserId(),
                userId);
    }

    @PostMapping("/{serverId}/leave")
    @PreAuthorize("@serverAccess.isMember(#serverId)")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void leaveServer(
            @PathVariable("serverId") UUID serverId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        serverService.leaveServer(
                serverId,
                principal.getUserId());
    }
}
