package com.cloudian.backend.modules.serverinvite.invitelink;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.cloudian.backend.modules.serverinvite.invitelink.dto.CreateInviteLinkRequest;
import com.cloudian.backend.modules.serverinvite.invitelink.dto.CreateInviteLinkResponse;
import com.cloudian.backend.modules.serverinvite.invitelink.dto.InviteLinkDetailsResponse;
import com.cloudian.backend.modules.serverinvite.invitelink.dto.InviteLinkResponse;
import com.cloudian.backend.modules.serverinvite.invitelink.dto.JoinServerInviteResponse;
import com.cloudian.backend.security.CustomUserDetails;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class InviteLinkController {

    private final InviteLinkService inviteLinkService;

    @GetMapping("/servers/{serverId}/invites/links")
    public ResponseEntity<List<InviteLinkResponse>> getInviteLinks(
            @PathVariable("serverId") UUID serverId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(
                inviteLinkService.getInviteLinks(serverId, principal.getUserId()));
    }

    @PostMapping("/servers/{serverId}/invites/links")
    public ResponseEntity<CreateInviteLinkResponse> createInviteLink(
            @PathVariable("serverId") UUID serverId,
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody CreateInviteLinkRequest request) {
        CreateInviteLinkResponse response = inviteLinkService.createInviteLink(
                serverId,
                principal.getUserId(),
                request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/servers/{serverId}/invites/links/{inviteId}")
    public ResponseEntity<Void> revokeInviteLink(
            @PathVariable("serverId") UUID serverId,
            @PathVariable("inviteId") UUID inviteId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        inviteLinkService.revokeInviteLink(serverId, inviteId, principal.getUserId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/invites/{token}")
    public ResponseEntity<InviteLinkDetailsResponse> getInviteLinkDetails(
            @PathVariable("token") String token) {
        return ResponseEntity.ok(inviteLinkService.getInviteLinkDetails(token));
    }

    @PostMapping("/invites/{token}/join")
    public ResponseEntity<JoinServerInviteResponse> joinServerByInviteLink(
            @PathVariable("token") String token,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(
                inviteLinkService.joinServerByInviteLink(token, principal.getUserId()));
    }
}
