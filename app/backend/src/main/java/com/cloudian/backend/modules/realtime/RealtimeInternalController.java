package com.cloudian.backend.modules.realtime;

import java.util.Map;
import java.util.UUID;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cloudian.backend.commons.enums.AccountStatus;
import com.cloudian.backend.filters.JwtRequestFilter;
import com.cloudian.backend.modules.realtime.dto.RealtimeSessionResponse;
import com.cloudian.backend.security.CustomUserDetails;

@RestController
@RequestMapping("/internal/realtime")
public class RealtimeInternalController {

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
}