package com.cloudian.backend.modules.serverinvite;

import java.util.UUID;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;

import com.cloudian.backend.modules.serverinvite.dto.InviteLinkResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.cloudian.backend.modules.serverinvite.dto.CreateDirectInviteRequest;
import com.cloudian.backend.modules.serverinvite.dto.DirectInviteResponse;
import com.cloudian.backend.modules.serverinvite.dto.CreateInviteLinkRequest;
import com.cloudian.backend.modules.serverinvite.dto.CreateInviteLinkResponse;
import com.cloudian.backend.security.CustomUserDetails;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/servers/{serverId}/invites")
@RequiredArgsConstructor
@Validated
public class ServerInviteController {

    private final ServerInviteService serverInviteService;

    @GetMapping("/links")
    public ResponseEntity<List<InviteLinkResponse>> getInviteLinks(
            @PathVariable UUID serverId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        List<InviteLinkResponse> response = serverInviteService.getInviteLinks(
                serverId,
                principal.getUserId());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/links")
    public ResponseEntity<CreateInviteLinkResponse> createInviteLink(
            @PathVariable UUID serverId,
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody CreateInviteLinkRequest request) {
        CreateInviteLinkResponse response = serverInviteService.createInviteLink(
                serverId,
                principal.getUserId(),
                request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @DeleteMapping("/links/{inviteId}")
    public ResponseEntity<Void> revokeInviteLink(
            @PathVariable UUID serverId,
            @PathVariable UUID inviteId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        serverInviteService.revokeInviteLink(
                serverId,
                inviteId,
                principal.getUserId());

        return ResponseEntity.noContent().build();
    }

    @PostMapping
    public ResponseEntity<DirectInviteResponse> createDirectInvite(
            @PathVariable UUID serverId,
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody CreateDirectInviteRequest request) {

        DirectInviteResponse response = serverInviteService.createDirectInvite(
                serverId,
                principal.getUserId(),
                request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }
}