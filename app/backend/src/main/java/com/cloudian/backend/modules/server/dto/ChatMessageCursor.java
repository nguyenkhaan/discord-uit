
package com.cloudian.backend.modules.server.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * Internal cursor used for keyset pagination.
 *
 * A cursor identifies the last message of the previous page
 * using both createdAt and id.
 */
public record ChatMessageCursor(
        Instant createdAt,
        UUID id) {
}
