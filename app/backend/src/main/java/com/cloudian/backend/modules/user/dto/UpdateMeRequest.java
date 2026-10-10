package com.cloudian.backend.modules.user.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * PATCH body: every field is optional; a null field means "leave unchanged".
 * Only self-editable fields belong here. Role, status, type and email are deliberately
 * absent, so clients cannot change them (unknown JSON fields are ignored).
 */
public record UpdateMeRequest(
        @Size(max = 100)
        @Pattern(regexp = ".*\\S.*", message = "must not be blank")
        String fullName
) {
}
