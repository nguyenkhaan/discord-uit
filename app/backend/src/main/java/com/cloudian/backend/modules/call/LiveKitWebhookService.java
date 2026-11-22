package com.cloudian.backend.modules.call;

import java.time.Instant;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cloudian.backend.configs.LiveKitProperties;
import com.cloudian.backend.exceptions.ApiException;
import com.cloudian.backend.models.CallSession;
import com.cloudian.backend.repositories.CallSessionRepository;
import com.cloudian.backend.repositories.LiveKitWebhookEventRepository;
import livekit.LivekitModels.ParticipantInfo;
import io.livekit.server.WebhookReceiver;
import livekit.LivekitWebhook.WebhookEvent;
import livekit.LivekitModels.TrackSource;

@Service
public class LiveKitWebhookService {

    private final WebhookReceiver webhookReceiver;
    private final LiveKitWebhookEventRepository webhookEventRepository;
    private final CallSessionRepository callSessionRepository;
    private final CallSessionService callSessionService;
    private final LiveKitRoomService liveKitRoomService;

    public LiveKitWebhookService(
            LiveKitProperties properties,
            LiveKitWebhookEventRepository webhookEventRepository,
            CallSessionRepository callSessionRepository,
            CallSessionService callSessionService,
            LiveKitRoomService liveKitRoomService) {

        this.webhookReceiver = new WebhookReceiver(
                properties.getApiKey(),
                properties.getApiSecret());

        this.webhookEventRepository = webhookEventRepository;
        this.callSessionRepository = callSessionRepository;
        this.callSessionService = callSessionService;
        this.liveKitRoomService = liveKitRoomService;
    }

    @Transactional
    public void handleWebhook(String body, String authorizationHeader) {

        // 1. Validate request.
        if (body == null || body.isBlank()
                || authorizationHeader == null
                || authorizationHeader.isBlank()) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid LiveKit webhook request.");
        }

        // 2. Verify signature and parse the webhook event.
        WebhookEvent event;

        try {
            event = webhookReceiver.receive(body, authorizationHeader);
        } catch (RuntimeException exception) {
            throw new ApiException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid LiveKit webhook signature.");
        }

        // 3. Extract event information.
        String eventId = event.getId();
        String eventType = event.getEvent();

        if (eventId == null || eventId.isBlank()
                || eventType == null || eventType.isBlank()) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "LiveKit webhook event ID and type are required.");
        }

        String roomName = event.hasRoom()
                ? event.getRoom().getName()
                : null;

        String participantIdentity = event.hasParticipant()
                ? event.getParticipant().getIdentity()
                : null;

        // 4. Save event ID before processing.
        // ON CONFLICT prevents duplicate processing.
        int inserted = webhookEventRepository.insertIfAbsent(
                eventId,
                eventType,
                roomName,
                participantIdentity,
                Instant.now());

        if (inserted == 0) {
            return;
        }

        // 5. Find the corresponding call session.
        if (roomName == null || roomName.isBlank()) {
            return;
        }

        CallSession callSession = callSessionRepository
                .findByLivekitRoomName(roomName)
                .orElse(null);

        if (callSession == null) {
            return;
        }

        UUID serverId = callSession.getServer().getId();

        // 6. Process supported Feature 4.1 events.
        switch (eventType) {

            case "participant_joined":

                if (!event.hasParticipant()) {
                    throw new ApiException(
                            HttpStatus.BAD_REQUEST,
                            "Participant information is missing.");
                }

                ParticipantInfo joinedParticipant = event.getParticipant();

                callSessionService.handleParticipantJoinedWebhook(
                        roomName,
                        parseParticipantIdentity(joinedParticipant.getIdentity()),
                        parseParticipantJoinedAt(joinedParticipant));

                break;

            case "participant_left":

                if (!event.hasParticipant()) {
                    throw new ApiException(
                            HttpStatus.BAD_REQUEST,
                            "Participant information is missing.");
                }

                ParticipantInfo leftParticipant = event.getParticipant();

                Instant leftAt = event.getCreatedAt() > 0
                        ? Instant.ofEpochSecond(event.getCreatedAt())
                        : Instant.now();

                callSessionService.handleParticipantLeftWebhook(
                        roomName,
                        parseParticipantIdentity(leftParticipant.getIdentity()),
                        parseParticipantJoinedAt(leftParticipant),
                        leftAt);

                break;

            case "room_finished":

                callSessionService.handleRoomFinishedWebhook(roomName);
                break;

            case "track_unpublished":

                if (!event.hasParticipant() || !event.hasTrack()) {
                    break;
                }

                // Only the video track decides the slot; screen audio is ignored.
                if (event.getTrack().getSource() != TrackSource.SCREEN_SHARE) {
                    break;
                }

                String sharerIdentity = event.getParticipant().getIdentity();

                boolean released = callSessionService
                        .handleScreenShareUnpublishedWebhook(
                                roomName,
                                parseParticipantIdentity(sharerIdentity));

                // Close the door: they must ask the backend again to share.
                if (released) {
                    liveKitRoomService.setScreenShareAllowed(
                            roomName, sharerIdentity, false);
                }

                break;
        }
    }

    private UUID parseParticipantIdentity(String identity) {

        if (identity == null || identity.isBlank()) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Participant identity is required.");
        }

        try {
            return UUID.fromString(identity);
        } catch (IllegalArgumentException exception) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid participant identity.");
        }
    }

    private Instant parseParticipantJoinedAt(ParticipantInfo participant) {

        // Prefer millisecond precision.
        if (participant.getJoinedAtMs() > 0) {
            return Instant.ofEpochMilli(participant.getJoinedAtMs());
        }

        // Fall back to Unix seconds.
        if (participant.getJoinedAt() > 0) {
            return Instant.ofEpochSecond(participant.getJoinedAt());
        }

        throw new ApiException(
                HttpStatus.BAD_REQUEST,
                "Participant joined timestamp is missing.");
    }
}