package com.cloudian.backend.modules.realtime;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}