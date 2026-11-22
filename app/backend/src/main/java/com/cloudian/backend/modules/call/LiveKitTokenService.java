
package com.cloudian.backend.modules.call;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import io.livekit.server.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.cloudian.backend.configs.LiveKitProperties;
import com.cloudian.backend.exceptions.ApiException;

@Service
public class LiveKitTokenService {

    private static final long TOKEN_EXPIRATION_MINUTES = 30;

    private final LiveKitProperties properties;

    public LiveKitTokenService(LiveKitProperties properties) {
        this.properties = properties;
    }

    /**
     * Generates a short-lived access token for a participant.
     */
    public String createParticipantToken(
            UUID userId,
            String roomName) {

        // 1. Validate input.
        if (userId == null || roomName == null || roomName.isBlank()) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "User ID and room name are required.");
        }

        // 2. Initialize the access token.
        AccessToken token = new AccessToken(
                properties.getApiKey(),
                properties.getApiSecret());

        // 3. Set participant identity.
        token.setIdentity(userId.toString());

        // 4. Set token expiration.
        token.setExpiration(
                Date.from(Instant.now().plus(
                        TOKEN_EXPIRATION_MINUTES,
                        ChronoUnit.MINUTES)));

        // 5. Grant permissions for the specific room.
        token.addGrants(
                new RoomJoin(true),
                new RoomName(roomName),
                new CanPublish(true),
                new CanPublishSources(List.of("camera", "microphone")),
                new CanSubscribe(true));

        // 6. Generate JWT.
        return token.toJwt();
    }
}
