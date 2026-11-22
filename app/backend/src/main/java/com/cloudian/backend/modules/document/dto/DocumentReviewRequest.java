package com.cloudian.backend.modules.document.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record DocumentReviewRequest(
        @NotNull DocumentReviewDecision decision,
        @Size(max = 2000) String rejectionReason
) {
}
