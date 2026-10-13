package com.cloudian.backend.modules.user.dto;

import jakarta.validation.constraints.NotBlank;

public record ConfirmEmailChangeRequest(
        @NotBlank String token
) {
}
