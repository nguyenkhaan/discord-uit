package com.cloudian.backend.modules.health;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cloudian.backend.modules.health.dto.HealthResponse;

@RestController
@RequestMapping("/health")
public class HealthController {
    @GetMapping
    public String liveness() {
        return "Build with Cloudian 💙 Cloud"; 
    }
    @GetMapping("/message") 
    public HealthResponse readness() {
        return (HealthResponse.builder().message("Cloudian love cloud").build()); 
    } 
}
