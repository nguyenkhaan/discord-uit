package com.cloudian.backend.modules.serverinvite.directinvite;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.cloudian.backend.modules.serverinvite.directinvite.dto.AcceptInviteResponse;
import com.cloudian.backend.modules.serverinvite.directinvite.dto.CreateDirectInviteRequest;
import com.cloudian.backend.modules.serverinvite.directinvite.dto.DeclineInviteResponse;
import com.cloudian.backend.modules.serverinvite.directinvite.dto.DirectInviteResponse;
import com.cloudian.backend.modules.serverinvite.directinvite.dto.MyDirectInviteResponse;
import com.cloudian.backend.security.CustomUserDetails;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class DirectInviteController {

    private final DirectInviteService directInviteService;

    @PostMapping("/servers/{serverId}/invites")
    public ResponseEntity<DirectInviteResponse> createDirectInvite(
            @PathVariable("serverId") UUID serverId,
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody CreateDirectInviteRequest request) {
        DirectInviteResponse response = directInviteService.createDirectInvite(
                serverId,
                principal.getUserId(),
                request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/users/me/invites")
    public ResponseEntity<List<MyDirectInviteResponse>> getMyInvites(
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(directInviteService.getMyDirectInvites(principal.getUserId()));
    }

    @PostMapping("/invites/{inviteId}/accept")
    public ResponseEntity<AcceptInviteResponse> acceptDirectInvite(
            @PathVariable("inviteId") UUID inviteId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(
                directInviteService.acceptDirectInvite(inviteId, principal.getUserId()));
    }

    @PostMapping("/invites/{inviteId}/decline")
    public ResponseEntity<DeclineInviteResponse> declineDirectInvite(
            @PathVariable("inviteId") UUID inviteId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(
                directInviteService.declineDirectInvite(inviteId, principal.getUserId()));
    }
}
