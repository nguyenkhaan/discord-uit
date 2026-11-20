
package com.cloudian.backend.modules.call;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cloudian.backend.commons.enums.CallEventType;
import com.cloudian.backend.commons.enums.CallStatus;
import com.cloudian.backend.exceptions.ApiException;
import com.cloudian.backend.models.CallEvent;
import com.cloudian.backend.models.CallSession;
import com.cloudian.backend.modules.call.dto.CallEventResponse;
import com.cloudian.backend.repositories.CallEventRepository;
import com.cloudian.backend.repositories.CallParticipationRepository;
import com.cloudian.backend.repositories.CallSessionRepository;
import com.cloudian.backend.repositories.UserAccountRepository;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class CallEventService {

    private final CallEventRepository callEventRepository;
    private final CallSessionRepository callSessionRepository;
    private final CallParticipationRepository callParticipationRepository;
    private final UserAccountRepository userAccountRepository;

    /**
     * Records an event occurring in an active call.
     */
    @Transactional
    public CallEvent recordEvent(
            UUID serverId,
            UUID actorUserId,
            UUID targetUserId,
            CallEventType eventType) {

        // 1. Validate event type.
        if (eventType == null) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Event type is required.");
        }

        // 2. Forced control events must specify a target.
        boolean requiresTarget = eventType == CallEventType.FORCE_MUTE
                || eventType == CallEventType.FORCE_SCREEN_SHARE_STOP;

        if (requiresTarget && targetUserId == null) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Target user is required for this event.");
        }

        // 3. Find the active call in this server.
        CallSession callSession = callSessionRepository
                .findByServer_IdAndStatus(serverId, CallStatus.ACTIVE)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "No active call found in this server."));

        // 4. Actor must currently participate in the call.
        boolean actorIsParticipant = callParticipationRepository
                .findByCallSession_IdAndUser_IdAndLeftAtIsNull(
                        callSession.getId(),
                        actorUserId)
                .isPresent();

        if (!actorIsParticipant) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "Actor is not an active participant in this call.");
        }

        // 5. If a target is specified, it must also be participating.
        if (targetUserId != null) {
            boolean targetIsParticipant = callParticipationRepository
                    .findByCallSession_IdAndUser_IdAndLeftAtIsNull(
                            callSession.getId(),
                            targetUserId)
                    .isPresent();

            if (!targetIsParticipant) {
                throw new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Target user is not an active participant in this call.");
            }
        }

        // 6. Create the event record.
        CallEvent event = new CallEvent();
        event.setCallSession(callSession);
        event.setActor(userAccountRepository.getReferenceById(actorUserId));
        event.setEventType(eventType);

        if (targetUserId != null) {
            event.setTarget(
                    userAccountRepository.getReferenceById(targetUserId));
        }

        return callEventRepository.save(event);
    }

    /**
     * Retrieves the event history of a call.
     * Only users who have participated in the call can view its history.
     */
    @Transactional(readOnly = true)
    public List<CallEventResponse> getEventHistory(
            UUID callSessionId,
            UUID userId) {

        // 1. Verify that the call session exists.
        callSessionRepository.findById(callSessionId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Call session not found."));

        // 2. Verify that the user has participated in this call before.
        boolean hasParticipated = callParticipationRepository
                .existsByCallSession_IdAndUser_Id(
                        callSessionId,
                        userId);

        if (!hasParticipated) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "You do not have permission to view this call history.");
        }

        // 3. Retrieve events in chronological order.
        List<CallEvent> events = callEventRepository
                .findAllByCallSession_IdOrderByCreatedAtAsc(callSessionId);

        // 4. Convert entities into response DTOs.
        return events.stream()
                .map(CallEventResponse::from)
                .toList();
    }

}
