package com.cloudian.backend.modules.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EmailChangeRequest(
        @NotBlank @Email @Size(max = 254) String newEmail,
        @NotBlank String currentPassword
) {
}
