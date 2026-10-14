package com.cloudian.backend.modules.auth;

import java.util.Map;
import java.util.UUID;

import com.cloudian.backend.modules.auth.dto.*;
import com.cloudian.backend.modules.user.EmailChangeService;
import com.cloudian.backend.modules.user.dto.ConfirmEmailChangeRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.cloudian.backend.exceptions.ApiException;
import com.cloudian.backend.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    private final EmailChangeService emailChangeService;
    private final CurrentSessionLogoutService logoutService;
    private final PasswordResetService passwordResetService;
    private final AuthenticationCookieService authenticationCookieService;
    private final SecurityContextLogoutHandler logoutHandler = new SecurityContextLogoutHandler();

    public AuthController(AuthService authService, CurrentSessionLogoutService logoutService,
                          EmailChangeService emailChangeService,
                          PasswordResetService passwordResetService,
                          AuthenticationCookieService authenticationCookieService) {
        this.authService = authService;
        this.logoutService = logoutService;
        this.emailChangeService = emailChangeService;
        this.passwordResetService = passwordResetService;
        this.authenticationCookieService = authenticationCookieService;
    }

    @PostMapping("/login")
    @SecurityRequirements
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse servletResponse) {
        LoginResponse tokens = authService.login(request);
        authenticationCookieService.writeAuthenticationCookies(servletResponse, tokens);
        return ResponseEntity.ok(tokens);
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @SecurityRequirements
    public RegisterResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.registerPersonalAccount(request);
    }

    @PostMapping("/verify-email")
    @SecurityRequirements
    public Map<String, String> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        authService.verifyEmail(request.token());
        return Map.of("message", "Email verified successfully.");
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @Valid @RequestBody(required = false) LogoutRequest request,
            HttpServletRequest servletRequest,
            HttpServletResponse servletResponse) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        CustomUserDetails userDetails = authenticatedUser(authentication);
        logoutService.logout(
                UUID.fromString(userDetails.getUserId()),
                accessToken(servletRequest),
                refreshToken(servletRequest, request));
        logoutHandler.logout(servletRequest, servletResponse, authentication);
        authenticationCookieService.clearAuthenticationCookies(servletResponse);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/logout-all")
    public ResponseEntity<Void> logoutAll(HttpServletResponse servletResponse) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        CustomUserDetails userDetails = authenticatedUser(authentication);

        authService.logoutAll(UUID.fromString(userDetails.getUserId()));

        SecurityContextHolder.clearContext();
        authenticationCookieService.clearAuthenticationCookies(servletResponse);

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/test-authentication")
    public String testingAuthentication() {
        return "Authentication successfully";
    }

    @PostMapping("/refresh")
    @SecurityRequirements
    public ResponseEntity<LoginResponse> refresh(
            @Valid @RequestBody(required = false) RefreshRequest request,
            HttpServletRequest servletRequest,
            HttpServletResponse servletResponse) {
        RefreshRequest refreshRequest = new RefreshRequest();
        refreshRequest.setRefreshToken(refreshToken(servletRequest, request));

        LoginResponse tokens = authService.refresh(refreshRequest);
        authenticationCookieService.writeAuthenticationCookies(servletResponse, tokens);
        return ResponseEntity.ok(tokens);
    }

    @PostMapping ("/confirm-email-change")
    @SecurityRequirements
    public Map<String, String> confirmEmailChange(
            @Valid @RequestBody ConfirmEmailChangeRequest request
            )
    {
        emailChangeService.confirm(request.token());
        return Map.of("message", "Email changed successfully.");
    }

    @PostMapping("/forgot-password")
    @ResponseStatus(HttpStatus.ACCEPTED)
    @SecurityRequirements
    public Map<String, String> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetService.requestReset(request);
        // Same answer whether the email exists or not (no account enumeration).
        return Map.of("message", "If this email is registered, a password reset link has been sent.");
    }

    @PostMapping("/reset-password")
    @SecurityRequirements
    public Map<String, String> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.resetPassword(request);
        return Map.of("message", "Password reset successfully. Please sign in again.");
    }

    private CustomUserDetails authenticatedUser(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication is required.");
        }
        return userDetails;
    }

    private String accessToken(HttpServletRequest request) {
        String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (authorization != null && !authorization.isBlank()) {
            if (!authorization.startsWith("Bearer ")) {
                throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication is required.");
            }

            return authorization.substring(7);
        }

        return authenticationCookieService.accessToken(request)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.UNAUTHORIZED,
                        "Authentication is required."));
    }

    private String refreshToken(
            HttpServletRequest request,
            LogoutRequest logoutRequest) {
        return authenticationCookieService.refreshToken(request)
                .orElseGet(() -> {
                    if (logoutRequest != null && logoutRequest.refreshToken() != null
                            && !logoutRequest.refreshToken().isBlank()) {
                        return logoutRequest.refreshToken();
                    }

                    throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication is required.");
                });
    }

    private String refreshToken(
            HttpServletRequest request,
            RefreshRequest refreshRequest) {
        return authenticationCookieService.refreshToken(request)
                .orElseGet(() -> {
                    if (refreshRequest != null && refreshRequest.getRefreshToken() != null
                            && !refreshRequest.getRefreshToken().isBlank()) {
                        return refreshRequest.getRefreshToken();
                    }

                    throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication is required.");
                });
    }
}
