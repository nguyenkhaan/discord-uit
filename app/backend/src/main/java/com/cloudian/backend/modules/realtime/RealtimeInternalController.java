package com.cloudian.backend.modules.realtime;

import java.util.Map;
import java.util.UUID;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cloudian.backend.commons.enums.AccountStatus;
import com.cloudian.backend.filters.JwtRequestFilter;
import com.cloudian.backend.modules.realtime.dto.RealtimeSessionResponse;
import com.cloudian.backend.modules.realtime.dto.RealtimeServerAuthorizationResponse;
import com.cloudian.backend.security.CustomUserDetails;

@RestController
@RequestMapping("/internal/realtime")
public class RealtimeInternalController {

    private final RealtimeAuthorizationService authorizationService;

    public RealtimeInternalController(
            RealtimeAuthorizationService authorizationService) {
        this.authorizationService = authorizationService;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of(
            "status", "UP",
            "message", "Cloudian 💙 Cloud", 
            "service", "spring-backend");
    }
    @PostMapping("/session/validate")
    public RealtimeSessionResponse validateSession(
        @AuthenticationPrincipal  CustomUserDetails userDetails, 
        @RequestAttribute (
            JwtRequestFilter.AUTHENTICATED_SESSION_ID_ATTRIBUTE 
        ) UUID sessionId 
    ) {
        return new RealtimeSessionResponse(
            userDetails.getUserId(),
            sessionId, 
            AccountStatus.ACTIVE
        );
    }

    @PostMapping("/servers/{serverId}/authorize")
    public RealtimeServerAuthorizationResponse authorizeServer(
            @PathVariable("serverId") UUID serverId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return authorizationService.authorizeServer(
                serverId,
                userDetails.getUserId());
    }
}
