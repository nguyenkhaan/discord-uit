
package com.cloudian.backend.modules.call;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cloudian.backend.configs.LiveKitProperties;
import com.cloudian.backend.models.CallParticipation;
import com.cloudian.backend.models.CallSession;
import com.cloudian.backend.models.UserAccount;
import com.cloudian.backend.modules.call.dto.ActiveCallResponse;
import com.cloudian.backend.modules.call.dto.LiveKitJoinResponse;
import com.cloudian.backend.repositories.CallParticipationRepository;
import com.cloudian.backend.repositories.UserAccountRepository;

import livekit.LivekitModels.ParticipantInfo;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class CallSessionLiveKitService {

    private static final Logger log = LoggerFactory.getLogger(CallSessionLiveKitService.class);

    private final CallSessionService callSessionService;
    private final LiveKitRoomService liveKitRoomService;
    private final LiveKitTokenService liveKitTokenService;
    private final LiveKitProperties liveKitProperties;
    private final CallParticipationRepository callParticipationRepository;
    private final UserAccountRepository userAccountRepository;

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
                liveKitProperties.getWebsocketUrl(),
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

    /**
     * Returns the active call of a server for the pre-join screen,
     * or empty when the server has no active call.
     * Participants are read from LiveKit (source of truth); if LiveKit
     * is unreachable we fall back to the participation records in the DB.
     */
    @Transactional(readOnly = true)
    public Optional<ActiveCallResponse> getActiveCall(UUID serverId, UUID userId) {

        Optional<CallSession> activeCall = callSessionService
                .findActiveCallForMember(serverId, userId);

        if (activeCall.isEmpty()) {
            return Optional.empty();
        }

        CallSession callSession = activeCall.get();

        // userId -> display name (null when unknown), keeps join order.
        Map<UUID, String> participants = new LinkedHashMap<>();

        try {
            for (ParticipantInfo info : liveKitRoomService
                    .listParticipants(callSession.getLivekitRoomName())) {
                try {
                    UUID participantId = UUID.fromString(info.getIdentity());
                    String name = info.getName();
                    participants.put(
                            participantId,
                            name != null && !name.isBlank() ? name : null);
                } catch (IllegalArgumentException ignored) {
                    // Identity is not a user id (e.g. an agent/bot); skip it.
                }
            }
        } catch (RuntimeException liveKitError) {
            log.warn(
                    "Could not list LiveKit participants for room {}, using DB records.",
                    callSession.getLivekitRoomName(),
                    liveKitError);

            callParticipationRepository
                    .findAllByCallSession_IdAndLeftAtIsNullOrderByJoinedAtAsc(
                            callSession.getId())
                    .forEach(participation -> participants.put(
                            participation.getUser().getId(),
                            null));
        }

        // Resolve missing names from user accounts in one query.
        List<UUID> unnamed = participants.entrySet().stream()
                .filter(entry -> entry.getValue() == null)
                .map(Map.Entry::getKey)
                .toList();

        if (!unnamed.isEmpty()) {
            for (UserAccount user : userAccountRepository.findAllById(unnamed)) {
                participants.put(user.getId(), user.getFullName());
            }
        }

        List<ActiveCallResponse.Participant> participantList = new ArrayList<>();
        participants.forEach((id, name) -> participantList.add(
                new ActiveCallResponse.Participant(id, name)));

        UserAccount coordinator = callSession.getCoordinator();

        return Optional.of(new ActiveCallResponse(
                callSession.getId(),
                callSession.getStartedAt(),
                coordinator.getId(),
                coordinator.getFullName(),
                participantList.size(),
                CallSessionService.MAX_PARTICIPANTS,
                participantList));
    }
}
