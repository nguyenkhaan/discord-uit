package com.cloudian.backend.modules.server.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DeleteServerRequest(

        @NotBlank(message = "Deletion reason is required.") @Size(max = 500, message = "Deletion reason must not exceed 500 characters.") String reason

) {
}