package com.cloudian.backend.modules.auth;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.cloudian.backend.modules.auth.dto.LoginRequest;
import com.cloudian.backend.modules.auth.dto.LoginResponse;
import com.cloudian.backend.modules.auth.dto.RegisterRequest;
import com.cloudian.backend.modules.auth.dto.RegisterResponse;
import com.cloudian.backend.modules.auth.dto.VerifyEmailRequest;
import com.cloudian.backend.services.AuthenticationService;

import jakarta.validation.Valid;

@RestController  
@RequestMapping("/auth") 
public class AuthController {
    private final AuthenticationService authenticationService;
    private final AuthService authService;

    public AuthController(AuthenticationService authenticationService, AuthService authService) {
        this.authenticationService = authenticationService;
        this.authService = authService;
    }

    @PostMapping ("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        String[] result = authenticationService.authenticate(request.getUsername() , request.getPassword());
        return ResponseEntity.ok(new LoginResponse(
            result[0] , result[1] 
        )); 
    }

    /** POST /api/auth/register — personal (non-UIT) account registration. */
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public RegisterResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.registerPersonalAccount(request);
    }

    /** POST /api/auth/verify-email — consumes the token sent by email and activates the account. */
    @PostMapping("/verify-email")
    public Map<String, String> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        authService.verifyEmail(request.token());
        return Map.of("message", "Email verified successfully.");
    }

    @GetMapping("/test-authentication")
    public String testingAuthentication() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication(); 
        System.out.println(authentication.getName());
        System.out.println(authentication.getPrincipal()); 
        return "Authentication successfully"; 
    }
}
