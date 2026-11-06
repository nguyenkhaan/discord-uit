// DeleteChatMessageRequest.java
package com.cloudian.backend.modules.chat.dto;

import jakarta.validation.constraints.Size;

public record DeleteChatMessageRequest(
        @Size(max = 255) String reason) {
}