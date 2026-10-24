package com.cloudian.backend.modules.serverinvite;

import com.cloudian.backend.modules.serverinvite.dto.AcceptInviteResponse;
import com.cloudian.backend.modules.serverinvite.dto.DeclineInviteResponse;
import com.cloudian.backend.modules.serverinvite.dto.InviteLinkDetailsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.UUID;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;

import com.cloudian.backend.modules.serverinvite.dto.JoinServerInviteResponse;
import com.cloudian.backend.security.CustomUserDetails;

@RestController
@RequestMapping("/invites")
@RequiredArgsConstructor
public class PublicInviteController {

    private final ServerInviteService serverInviteService;

    @GetMapping("/{token}")
    public ResponseEntity<InviteLinkDetailsResponse> getInviteLinkDetails(
            @PathVariable String token) {
        return ResponseEntity.ok(
                serverInviteService.getInviteLinkDetails(token));
    }

    @PostMapping("/{token}/join")
    public ResponseEntity<JoinServerInviteResponse> joinServerByInviteLink(
            @PathVariable String token,
            @AuthenticationPrincipal CustomUserDetails principal) {
        JoinServerInviteResponse response = serverInviteService.joinServerByInviteLink(
                token,
                principal.getUserId());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{inviteId}/accept")
    public ResponseEntity<AcceptInviteResponse> acceptDirectInvite(
            @PathVariable UUID inviteId,
            @AuthenticationPrincipal CustomUserDetails principal) {

        AcceptInviteResponse response = serverInviteService.acceptDirectInvite(
                inviteId,
                principal.getUserId());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{inviteId}/decline")
    public ResponseEntity<DeclineInviteResponse> declineDirectInvite(
            @PathVariable UUID inviteId,
            @AuthenticationPrincipal CustomUserDetails principal) {

        DeclineInviteResponse response = serverInviteService.declineDirectInvite(
                inviteId,
                principal.getUserId());

        return ResponseEntity.ok(response);
    }
}