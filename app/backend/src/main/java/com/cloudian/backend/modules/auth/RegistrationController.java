package com.cloudian.backend.modules.auth;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.cloudian.backend.modules.auth.dto.RegisterRequest;
import com.cloudian.backend.modules.auth.dto.RegisterResponse;
import com.cloudian.backend.modules.auth.dto.VerifyEmailRequest;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/auth")
public class RegistrationController {

    private final RegistrationService registrationService;

    public RegistrationController(RegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    /** POST /api/auth/register — personal (non-UIT) account registration. */
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public RegisterResponse register(@Valid @RequestBody RegisterRequest request) {
        return registrationService.registerPersonalAccount(request);
    }

    /** POST /api/auth/verify-email — consumes the token sent by email and activates the account. */
    @PostMapping("/verify-email")
    public Map<String, String> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        registrationService.verifyEmail(request.token());
        return Map.of("message", "Email verified successfully.");
    }
}
