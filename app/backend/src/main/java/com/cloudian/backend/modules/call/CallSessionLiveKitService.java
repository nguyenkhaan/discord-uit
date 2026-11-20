
package com.cloudian.backend.modules.call;

import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cloudian.backend.configs.LiveKitProperties;
import com.cloudian.backend.models.CallParticipation;
import com.cloudian.backend.models.CallSession;
import com.cloudian.backend.modules.call.dto.LiveKitJoinResponse;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class CallSessionLiveKitService {

    private static final Logger log = LoggerFactory.getLogger(CallSessionLiveKitService.class);

    private final CallSessionService callSessionService;
    private final LiveKitRoomService liveKitRoomService;
    private final LiveKitTokenService liveKitTokenService;
    private final LiveKitProperties liveKitProperties;

    /**
     * Creates a LiveKit room and starts a call session.
     */
    public CallSession startCall(UUID serverId, UUID userId) {

        // 1. Generate a unique LiveKit room name.
        String roomName = "call-" + UUID.randomUUID();

        // 2. Create the room on LiveKit.
        liveKitRoomService.createRoom(roomName);

        try {
            // 3. Persist the call session in the database.
            return callSessionService.startCall(
                    serverId,
                    userId,
                    roomName);

        } catch (RuntimeException exception) {

            // 4. Compensate by deleting the room if DB operation fails.
            try {
                liveKitRoomService.deleteRoom(roomName);

            } catch (RuntimeException cleanupException) {
                exception.addSuppressed(cleanupException);

                log.error(
                        "Failed to clean up LiveKit room: {}",
                        roomName,
                        cleanupException);
            }

            throw exception;
        }
    }

    /**
     * Joins an active call and generates a LiveKit access token.
     */
    @Transactional
    public LiveKitJoinResponse joinCall(UUID serverId, UUID userId) {

        // 1. Join the call and create a participation record.
        // CallSessionService validates membership and participant limit.
        CallSession callSession = callSessionService.joinCall(serverId, userId);

        String roomName = callSession.getLivekitRoomName();

        // 3. Generate a short-lived LiveKit access token.
        String token = liveKitTokenService.createParticipantToken(
                userId,
                roomName);

        // 4. Return connection information to the client.
        return new LiveKitJoinResponse(
                callSession.getId(),
                roomName,
                liveKitProperties.getUrl(),
                token);
    }

    @Transactional
    public void endCall(UUID serverId, UUID userId) {

        // 1. Verify coordinator and retrieve the room name.
        // The server lock remains held by the outer transaction.
        String roomName = callSessionService
                .getRoomNameForEnding(serverId, userId);

        // 2. Delete the LiveKit room.
        // If deletion fails, the database transaction is rolled back.
        liveKitRoomService.deleteRoom(roomName);

        // 3. Update the call session and its participations.
        callSessionService.endCall(serverId, userId);
    }

    /**
     * Explicitly disconnects a participant from an active call.
     */
    public void leaveCall(UUID serverId, UUID userId) {

        // 1. Verify participation and retrieve room name.
        String roomName = callSessionService
                .getRoomNameForLeaving(serverId, userId);

        // 2. Remove participant from LiveKit.
        liveKitRoomService.removeParticipant(
                roomName,
                userId.toString());
    }
}
