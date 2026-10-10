package com.cloudian.backend.modules.user;

import java.util.UUID;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cloudian.backend.modules.user.dto.MeResponse;
import com.cloudian.backend.modules.user.dto.UpdateMeRequest;
import com.cloudian.backend.security.CustomUserDetails;

import jakarta.validation.Valid;

/** /api/me — the current user reads and updates their own profile. Requires a valid access token. */
@RestController
@RequestMapping("/me")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public MeResponse getMe(@AuthenticationPrincipal CustomUserDetails principal) {
        return userService.getMe(currentUserId(principal));
    }

    @PatchMapping
    public MeResponse updateMe(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody UpdateMeRequest request
    ) {
        return userService.updateMe(currentUserId(principal), request);
    }

    private static UUID currentUserId(CustomUserDetails principal) {
        return UUID.fromString(principal.getUserId());
    }
}
