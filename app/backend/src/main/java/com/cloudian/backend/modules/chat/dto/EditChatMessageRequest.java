// EditChatMessageRequest.java
package com.cloudian.backend.modules.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EditChatMessageRequest(
        @NotBlank @Size(max = 2_000) String contentText) {
}