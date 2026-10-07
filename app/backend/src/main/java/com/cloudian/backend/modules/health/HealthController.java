package com.cloudian.backend.modules.health;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import com.cloudian.backend.exceptions.ApiException;
import com.cloudian.backend.messagings.RabbitMQProducer;
import com.cloudian.backend.modules.health.dto.HealthResponse;

@RestController
@RequestMapping("/health")
public class HealthController {
    private final JdbcTemplate jdbcTemplate; 
    @Autowired  
    RabbitMQProducer rabbitMQProducer;
    public HealthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }
    @GetMapping
    public String liveness() {
        return "Build with Cloudian 💙 Cloud"; 
    }
    @GetMapping("/message") 
    public HealthResponse readness() {
        return (HealthResponse.builder().message("Cloudian love cloud").build()); 
    } 
    @GetMapping("/error") 
    public void HealthError() {
        throw new ApiException(401,"User cannot be null"); 
    }
    @GetMapping ("/database") 
    public Map<String, Object> TestingHealth() {
            Integer result = jdbcTemplate.queryForObject(
            "SELECT 1",
            Integer.class
        );
        return Map.of(
            "database", "connected", 
            "result", result
        );
    }
    @GetMapping("/rabbitmq") 
    public Map<String, Object> TestingRabbitMQHandler() {
        String message = "Hello world from cloudian";
        rabbitMQProducer.sendMessage(message);
        return Map.of("status" , "Message sent");
    }
}
