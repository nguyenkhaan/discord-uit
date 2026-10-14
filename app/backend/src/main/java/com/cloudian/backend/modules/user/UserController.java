package com.cloudian.backend.modules.user;

import java.util.UUID;

import com.cloudian.backend.modules.user.dto.ChangePasswordRequest;
import com.cloudian.backend.modules.user.dto.EmailChangeRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.cloudian.backend.modules.user.dto.MeResponse;
import com.cloudian.backend.modules.user.dto.UpdateMeRequest;
import com.cloudian.backend.security.CustomUserDetails;

import jakarta.validation.Valid;

/** /api/me — the current user reads and updates their own profile. Requires a valid access token. */
@RequiredArgsConstructor
@RestController
@RequestMapping("/me")
public class UserController {

    private final UserService userService;
    private final EmailChangeService emailChangeService;
    private final PasswordChangeService passwordChangeService;

//    public UserController(UserService userService) {
//        this.userService = userService;
//    }

    @GetMapping
    public MeResponse getMe(@AuthenticationPrincipal CustomUserDetails principal) {
        System.out.println("Hello world");
        return userService.getMe(currentUserId(principal));
    }

    @PatchMapping
    public MeResponse updateMe(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody UpdateMeRequest request
    ) {
        return userService.updateMe(currentUserId(principal), request);
    }

    @PostMapping ("/email-change")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void requestEmailChange(@AuthenticationPrincipal CustomUserDetails principal,
                                   @Valid @RequestBody EmailChangeRequest request) {
        emailChangeService.request(UUID.fromString(principal.getUserId()), request);
    }

    @PostMapping("/password-change")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@AuthenticationPrincipal CustomUserDetails principal,
                               @Valid @RequestBody ChangePasswordRequest request) {
        passwordChangeService.change(currentUserId(principal), request);
    }

    private static UUID currentUserId(CustomUserDetails principal) {
        return UUID.fromString(principal.getUserId());
    }
}
