package com.cloudian.backend.modules.serverinvite;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cloudian.backend.modules.serverinvite.dto.MyDirectInviteResponse;
import com.cloudian.backend.security.CustomUserDetails;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/users/me/invites")
@RequiredArgsConstructor
public class MyInviteController {

    private final ServerInviteService serverInviteService;

    @GetMapping
    public ResponseEntity<List<MyDirectInviteResponse>> getMyInvites(
            @AuthenticationPrincipal CustomUserDetails principal) {

        List<MyDirectInviteResponse> response = serverInviteService.getMyDirectInvites(principal.getUserId());

        return ResponseEntity.ok(response);
    }
}