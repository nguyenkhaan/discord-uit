package com.cloudian.backend.modules.health.dto;

import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Getter  
@Setter  
@Data 
@Builder 
public class HealthResponse {
    private String message; 
}
