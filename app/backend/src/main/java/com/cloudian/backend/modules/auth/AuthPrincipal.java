package com.cloudian.backend.modules.auth;

import java.util.UUID;

import com.cloudian.backend.commons.enums.SystemRole;

public record AuthPrincipal(UUID userId, SystemRole role, UUID sessionId) {
}