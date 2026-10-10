package com.cloudian.backend.modules.notification.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record NotificationRequest(
		@NotBlank @Size(max = 100) String recipientId,
		@NotBlank @Size(max = 1_000) String message) {
}
