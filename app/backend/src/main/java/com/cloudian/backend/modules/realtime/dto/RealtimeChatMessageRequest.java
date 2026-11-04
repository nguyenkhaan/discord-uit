package com.cloudian.backend.modules.realtime.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RealtimeChatMessageRequest(
        @NotNull UUID clientRequestId,
        @NotBlank @Size(max = 2_000) String contentText) {
}
