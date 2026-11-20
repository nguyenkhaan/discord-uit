
package com.cloudian.backend.modules.call.dto;

import java.util.UUID;

public record LiveKitJoinResponse(
        UUID callSessionId,
        String roomName,
        String serverUrl,
        String token) {
}
