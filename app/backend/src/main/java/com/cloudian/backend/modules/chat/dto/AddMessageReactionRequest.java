
package com.cloudian.backend.modules.chat.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public record AddMessageReactionRequest(
        @NotNull UUID iconId) {
}
