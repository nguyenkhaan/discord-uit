package com.cloudian.backend.modules.call;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cloudian.backend.commons.enums.CallEventType;
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
     * Appends an event to a call.
     * Locking and authorization are done by CallSessionService;
     * this method only validates the event shape.
     */
    @Transactional
    public CallEvent record(
            CallSession callSession,
            UUID actorUserId,
            UUID targetUserId,
            CallEventType eventType) {

        if (callSession == null || actorUserId == null || eventType == null) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Call session, actor and event type are required.");
        }

        boolean requiresTarget = eventType == CallEventType.FORCE_MUTE
                || eventType == CallEventType.FORCE_SCREEN_SHARE_STOP;

        if (requiresTarget && targetUserId == null) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Target user is required for this event.");
        }

        CallEvent event = new CallEvent();
        event.setCallSession(callSession);
        event.setActor(userAccountRepository.getReferenceById(actorUserId));
        event.setEventType(eventType);

        if (targetUserId != null) {
            event.setTarget(userAccountRepository.getReferenceById(targetUserId));
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

        callSessionRepository.findById(callSessionId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Call session not found."));

        boolean hasParticipated = callParticipationRepository
                .existsByCallSession_IdAndUser_Id(callSessionId, userId);

        if (!hasParticipated) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "You do not have permission to view this call history.");
        }

        return callEventRepository
                .findAllByCallSession_IdOrderByCreatedAtAsc(callSessionId)
                .stream()
                .map(CallEventResponse::from)
                .toList();
    }
}