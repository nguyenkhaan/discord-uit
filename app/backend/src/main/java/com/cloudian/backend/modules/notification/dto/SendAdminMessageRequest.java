package com.cloudian.backend.modules.notification.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SendAdminMessageRequest(
        @NotNull UUID recipientUserId,
        @NotBlank @Size(max = 255) String content
) {
}
