
package com.cloudian.backend.modules.call;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.cloudian.backend.commons.enums.ServerMemberRole;

import com.cloudian.backend.commons.enums.CallStatus;
import com.cloudian.backend.commons.enums.ServerStatus;
import com.cloudian.backend.exceptions.ApiException;
import com.cloudian.backend.models.CallParticipation;
import com.cloudian.backend.models.CallSession;
import com.cloudian.backend.models.Server;
import com.cloudian.backend.models.UserAccount;
import com.cloudian.backend.repositories.CallParticipationRepository;
import com.cloudian.backend.repositories.CallSessionRepository;
import com.cloudian.backend.repositories.ServerMembershipRepository;
import com.cloudian.backend.repositories.ServerRepository;
import com.cloudian.backend.repositories.UserAccountRepository;
import com.cloudian.backend.commons.enums.CallEventType;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class CallSessionService {
        public static final int MAX_PARTICIPANTS = 30;

        private final CallSessionRepository callSessionRepository;
        private final CallParticipationRepository callParticipationRepository;
        private final ServerRepository serverRepository;
        private final ServerMembershipRepository serverMembershipRepository;
        private final UserAccountRepository userAccountRepository;
        private final CallEventService callEventService;

        /**
         * Starts a new call in a server.
         * The user who starts the call becomes its coordinator
         * and the first participant.
         */
        @Transactional
        public CallSession startCall(
                        UUID serverId,
                        UUID userId,
                        String roomName) {

                if (roomName == null || roomName.isBlank()) {
                        throw new ApiException(
                                        HttpStatus.BAD_REQUEST,
                                        "LiveKit room name is required.");
                }
                // 1. Lock the server to prevent concurrent call creation.
                Server server = serverRepository
                                .findByIdAndDeletedAtIsNullForUpdate(serverId)
                                .orElseThrow(CallSessionService::serverNotFound);

                // 2. Only active servers can start a call.
                if (server.getStatus() != ServerStatus.ACTIVE) {
                        throw new ApiException(
                                        HttpStatus.CONFLICT,
                                        "Cannot start a call in an inactive server.");
                }

                // 3. Verify that the user is an active member of this server.
                serverMembershipRepository
                                .findActiveRole(serverId, userId)
                                .orElseThrow(() -> new ApiException(
                                                HttpStatus.FORBIDDEN,
                                                "You are not an active member of this server."));

                // 4. A server can only have one active call.
                boolean hasActiveCall = callSessionRepository
                                .existsByServer_IdAndStatus(serverId, CallStatus.ACTIVE);

                if (hasActiveCall) {
                        throw new ApiException(
                                        HttpStatus.CONFLICT,
                                        "This server already has an active call.");
                }

                Instant now = Instant.now();

                // 5. Create the call session.
                CallSession callSession = new CallSession();
                callSession.setServer(server);
                callSession.setCoordinator(
                                userAccountRepository.getReferenceById(userId));
                callSession.setStatus(CallStatus.ACTIVE);
                callSession.setLivekitRoomName(roomName);
                callSession.setStartedAt(now);

                CallSession savedSession = callSessionRepository.save(callSession);

                // 6. The user who starts the call is also its first participant.
                return savedSession;
        }

        /**
         * Returns the active call of a server (if any) for an active member.
         * Read-only: does not lock the server.
         */
        @Transactional(readOnly = true)
        public Optional<CallSession> findActiveCallForMember(
                        UUID serverId,
                        UUID userId) {

                serverRepository
                                .findByIdAndDeletedAtIsNull(serverId)
                                .orElseThrow(CallSessionService::serverNotFound);

                serverMembershipRepository
                                .findActiveRole(serverId, userId)
                                .orElseThrow(CallSessionService::serverNotFound);

                return callSessionRepository
                                .findByServer_IdAndStatus(serverId, CallStatus.ACTIVE);
        }

        private static ApiException serverNotFound() {
                return new ApiException(
                                HttpStatus.NOT_FOUND,
                                "Server not found.");
        }

        /**
         * Allows an active server member to join the current call.
         */
        @Transactional
        public CallSession joinCall(UUID serverId, UUID userId) {

                // 1. Lock the server to serialize concurrent join requests.
                Server server = serverRepository
                                .findByIdAndDeletedAtIsNullForUpdate(serverId)
                                .orElseThrow(CallSessionService::serverNotFound);

                // 2. Only active servers allow joining calls.
                if (server.getStatus() != ServerStatus.ACTIVE) {
                        throw new ApiException(
                                        HttpStatus.CONFLICT,
                                        "Cannot join a call in an inactive server.");
                }

                // 3. Verify that the user is an active member.
                serverMembershipRepository
                                .findActiveRole(serverId, userId)
                                .orElseThrow(CallSessionService::serverNotFound);

                // 4. Find the active call in this server.
                CallSession callSession = callSessionRepository
                                .findByServer_IdAndStatus(serverId, CallStatus.ACTIVE)
                                .orElseThrow(() -> new ApiException(
                                                HttpStatus.NOT_FOUND,
                                                "No active call found in this server."));

                //    rejoin is allowed. LiveKit disconnects the old
                //    connection with the same identity, and the
                //    participant_joined webhook closes the old participation.
                boolean alreadyJoined = callParticipationRepository
                        .findByCallSession_IdAndUser_IdAndLeftAtIsNull(
                                callSession.getId(),
                                userId)
                        .isPresent();

                // 6. Check the participant limit (a rejoining user already holds a slot).
                if (!alreadyJoined) {
                        long participantCount = callParticipationRepository
                                .countByCallSession_IdAndLeftAtIsNull(callSession.getId());

                        if (participantCount >= MAX_PARTICIPANTS) {
                                throw new ApiException(
                                        HttpStatus.CONFLICT,
                                        "This call has reached its participant limit.");
                        }
                }

                return callSession;
        }

        /**
         * Allows a participant to leave the active call.
         * If the last participant leaves, the call is automatically ended.
         */
        @Transactional
        public void leaveCall(UUID serverId, UUID userId) {

                // 1. Lock the server to serialize concurrent call operations.
                serverRepository
                                .findByIdAndDeletedAtIsNullForUpdate(serverId)
                                .orElseThrow(CallSessionService::serverNotFound);

                // 2. Find the active call.
                CallSession callSession = callSessionRepository
                                .findByServer_IdAndStatus(serverId, CallStatus.ACTIVE)
                                .orElseThrow(() -> new ApiException(
                                                HttpStatus.NOT_FOUND,
                                                "No active call found in this server."));

                // 3. Find the user's active participation.
                CallParticipation participation = callParticipationRepository
                                .findByCallSession_IdAndUser_IdAndLeftAtIsNull(
                                                callSession.getId(),
                                                userId)
                                .orElseThrow(() -> new ApiException(
                                                HttpStatus.NOT_FOUND,
                                                "You are not currently participating in this call."));

                Instant now = Instant.now();

                // 4. Mark the participant as having left.
                participation.setLeftAt(now);
                callParticipationRepository.save(participation);

                // 5. Clear screen-sharing state if this user was sharing.
                if (callSession.getActiveScreenSharer() != null
                                && callSession.getActiveScreenSharer().getId().equals(userId)) {
                        callSession.setActiveScreenSharer(null);
                }

                // 6. End the call when the last participant leaves.
                long remainingParticipants = callParticipationRepository
                                .countByCallSession_IdAndLeftAtIsNull(callSession.getId());

                if (remainingParticipants == 0) {
                        callSession.setStatus(CallStatus.ENDED);
                        callSession.setEndedAt(now);
                }

                callSessionRepository.save(callSession);
        }

        /**
         * Ends the active call.
         * Only the call coordinator can end the call.
         */
        @Transactional
        public void endCall(UUID serverId, UUID userId) {

                // 1. Lock the server to serialize concurrent call operations.
                serverRepository
                                .findByIdAndDeletedAtIsNullForUpdate(serverId)
                                .orElseThrow(CallSessionService::serverNotFound);

                // 2. Find the active call.
                CallSession callSession = callSessionRepository
                                .findByServer_IdAndStatus(serverId, CallStatus.ACTIVE)
                                .orElseThrow(() -> new ApiException(
                                                HttpStatus.NOT_FOUND,
                                                "No active call found in this server."));

                // 3. Only the coordinator can end the call.
                if (!callSession.getCoordinator().getId().equals(userId)) {
                        throw new ApiException(
                                        HttpStatus.FORBIDDEN,
                                        "Only the call coordinator can end this call.");
                }

                Instant now = Instant.now();

                // 4. Mark all remaining participants as having left.
                var activeParticipations = callParticipationRepository
                                .findAllByCallSession_IdAndLeftAtIsNullOrderByJoinedAtAsc(
                                                callSession.getId());

                activeParticipations.forEach(participation -> participation.setLeftAt(now));

                callParticipationRepository.saveAll(activeParticipations);

                // 5. Clear the active screen sharer.
                callSession.setActiveScreenSharer(null);

                // 6. Mark the call as ended.
                callSession.setStatus(CallStatus.ENDED);
                callSession.setEndedAt(now);

                callSessionRepository.save(callSession);
        }


        /**
         * Reserves the single screen-share slot for an active participant.
         * Returns the call so the caller can grant the LiveKit permission.
         */
        @Transactional
        public CallSession startScreenShare(UUID serverId, UUID userId) {

                // 1. Serialize concurrent share attempts on the server row.
                lockServer(serverId);

                // 2. Find the active call.
                CallSession callSession = findActiveCall(serverId);

                // 3. Only active participants can share.
                requireActiveParticipant(
                        callSession,
                        userId,
                        "You are not an active participant in this call.");

                // 4. Only one participant can share at a time.
                UserAccount activeSharer = callSession.getActiveScreenSharer();

                if (activeSharer != null) {
                        if (activeSharer.getId().equals(userId)) {
                                // Retry from the same user: keep the slot, no new event.
                                return callSession;
                        }
                        throw new ApiException(
                                HttpStatus.CONFLICT,
                                "Someone is already sharing their screen.");
                }

                // 5. Take the slot and record the event.
                callSession.setActiveScreenSharer(
                        userAccountRepository.getReferenceById(userId));
                callSessionRepository.save(callSession);

                callEventService.record(
                        callSession,
                        userId,
                        null,
                        CallEventType.SCREEN_SHARE_STARTED);

                return callSession;
        }

        /**
         * Releases the caller's slot. Idempotent: the track_unpublished
         * webhook may already have released it.
         * Returns the room name so the caller can revoke the LiveKit permission.
         */
        @Transactional
        public String stopScreenShare(UUID serverId, UUID userId) {

                lockServer(serverId);
                CallSession callSession = findActiveCall(serverId);

                clearSharerIfMatches(callSession, userId);

                return callSession.getLivekitRoomName();
        }

        /**
         * Authorizes a force mute before LiveKit is called.
         */
        @Transactional
        public CallSession authorizeForceMute(
                UUID serverId,
                UUID actorUserId,
                UUID targetUserId) {

                lockServer(serverId);
                CallSession callSession = findActiveCall(serverId);
                requireCoordinatorControl(callSession, actorUserId, targetUserId);

                return callSession;
        }

        /**
         * Records a force mute after LiveKit succeeded.
         */
        @Transactional
        public void completeForceMute(
                CallSession callSession,
                UUID actorUserId,
                UUID targetUserId) {

                callEventService.record(
                        callSession,
                        actorUserId,
                        targetUserId,
                        CallEventType.FORCE_MUTE);
        }

        /**
         * Authorizes a forced screen-share stop before LiveKit is called.
         */
        @Transactional
        public CallSession authorizeForceStopScreenShare(
                UUID serverId,
                UUID actorUserId,
                UUID targetUserId) {

                lockServer(serverId);
                CallSession callSession = findActiveCall(serverId);
                requireCoordinatorControl(callSession, actorUserId, targetUserId);

                UserAccount activeSharer = callSession.getActiveScreenSharer();

                if (activeSharer == null || !activeSharer.getId().equals(targetUserId)) {
                        throw new ApiException(
                                HttpStatus.CONFLICT,
                                "The target user is not currently sharing their screen.");
                }

                return callSession;
        }

        /**
         * Clears the sharer and records the forced stop after LiveKit succeeded.
         */
        @Transactional
        public void completeForceStopScreenShare(
                CallSession callSession,
                UUID actorUserId,
                UUID targetUserId) {

                callSession.setActiveScreenSharer(null);
                callSessionRepository.save(callSession);

                callEventService.record(
                        callSession,
                        actorUserId,
                        targetUserId,
                        CallEventType.FORCE_SCREEN_SHARE_STOP);
        }

        /**
         * Releases the slot when LiveKit reports that the sharer's screen
         * track was unpublished (browser "Stop sharing", crash, revoke).
         * Returns true when the slot was released.
         */
        @Transactional
        public boolean handleScreenShareUnpublishedWebhook(
                String roomName,
                UUID userId) {

                CallSession initialSession = callSessionRepository
                        .findByLivekitRoomNameAndStatus(roomName, CallStatus.ACTIVE)
                        .orElse(null);

                if (initialSession == null) {
                        return false;
                }

                UUID serverId = initialSession.getServer().getId();

                if (serverRepository
                        .findByIdAndDeletedAtIsNullForUpdate(serverId)
                        .isEmpty()) {
                        return false;
                }

                CallSession callSession = callSessionRepository
                        .findByLivekitRoomNameAndStatus(roomName, CallStatus.ACTIVE)
                        .orElse(null);

                if (callSession == null) {
                        return false;
                }

                return clearSharerIfMatches(callSession, userId);
        }

        /**
         * Coordinator controls require: the actor IS the coordinator,
         * the coordinator is connected right now, and the target is another
         * active participant. Server role (OWNER) is intentionally ignored.
         */
        private void requireCoordinatorControl(
                CallSession callSession,
                UUID actorUserId,
                UUID targetUserId) {

                if (targetUserId == null) {
                        throw new ApiException(
                                HttpStatus.BAD_REQUEST,
                                "Target user is required.");
                }

                if (!callSession.getCoordinator().getId().equals(actorUserId)) {
                        throw new ApiException(
                                HttpStatus.FORBIDDEN,
                                "Only the call coordinator can control participants.");
                }

                requireActiveParticipant(
                        callSession,
                        actorUserId,
                        "The call coordinator must be in the call to control participants.");

                if (actorUserId.equals(targetUserId)) {
                        throw new ApiException(
                                HttpStatus.BAD_REQUEST,
                                "Coordinator controls cannot target yourself.");
                }

                if (!isActiveParticipant(callSession, targetUserId)) {
                        throw new ApiException(
                                HttpStatus.NOT_FOUND,
                                "Target user is not an active participant in this call.");
                }
        }

        /**
         * Clears the slot if this user holds it and records SCREEN_SHARE_STOPPED.
         * Whoever clears first (API or webhook) records the event, exactly once.
         */
        private boolean clearSharerIfMatches(CallSession callSession, UUID userId) {

                UserAccount activeSharer = callSession.getActiveScreenSharer();

                if (activeSharer == null || !activeSharer.getId().equals(userId)) {
                        return false;
                }

                callSession.setActiveScreenSharer(null);
                callSessionRepository.save(callSession);

                callEventService.record(
                        callSession,
                        userId,
                        null,
                        CallEventType.SCREEN_SHARE_STOPPED);

                return true;
        }

        private void lockServer(UUID serverId) {
                serverRepository
                        .findByIdAndDeletedAtIsNullForUpdate(serverId)
                        .orElseThrow(CallSessionService::serverNotFound);
        }

        private CallSession findActiveCall(UUID serverId) {
                return callSessionRepository
                        .findByServer_IdAndStatus(serverId, CallStatus.ACTIVE)
                        .orElseThrow(() -> new ApiException(
                                HttpStatus.NOT_FOUND,
                                "No active call found in this server."));
        }

        private boolean isActiveParticipant(CallSession callSession, UUID userId) {
                return callParticipationRepository
                        .findByCallSession_IdAndUser_IdAndLeftAtIsNull(
                                callSession.getId(),
                                userId)
                        .isPresent();
        }

        private void requireActiveParticipant(
                CallSession callSession,
                UUID userId,
                String message) {

                if (!isActiveParticipant(callSession, userId)) {
                        throw new ApiException(HttpStatus.FORBIDDEN, message);
                }
        }


        /**
         * Retrieves the active call's LiveKit room name
         * after verifying that the requester is its coordinator.
         */
        @Transactional
        public String getRoomNameForEnding(UUID serverId, UUID userId) {

                // 1. Lock the server.
                serverRepository
                                .findByIdAndDeletedAtIsNullForUpdate(serverId)
                                .orElseThrow(CallSessionService::serverNotFound);

                // 2. Find the active call.
                CallSession callSession = callSessionRepository
                                .findByServer_IdAndStatus(serverId, CallStatus.ACTIVE)
                                .orElseThrow(() -> new ApiException(
                                                HttpStatus.NOT_FOUND,
                                                "No active call found in this server."));

                // 3. Only the coordinator can end the call.
                if (!callSession.getCoordinator().getId().equals(userId)) {
                        throw new ApiException(
                                        HttpStatus.FORBIDDEN,
                                        "Only the call coordinator can end this call.");
                }

                // 4. Return the room name for LiveKit cleanup.
                return callSession.getLivekitRoomName();
        }

        @Transactional
        public String getRoomNameForLeaving(UUID serverId, UUID userId) {

                // 1. Lock the server.
                serverRepository
                                .findByIdAndDeletedAtIsNullForUpdate(serverId)
                                .orElseThrow(CallSessionService::serverNotFound);

                // 2. Find the active call.
                CallSession callSession = callSessionRepository
                                .findByServer_IdAndStatus(serverId, CallStatus.ACTIVE)
                                .orElseThrow(() -> new ApiException(
                                                HttpStatus.NOT_FOUND,
                                                "No active call found in this server."));

                // 3. Verify active participation.
                boolean isParticipant = callParticipationRepository
                                .findByCallSession_IdAndUser_IdAndLeftAtIsNull(
                                                callSession.getId(),
                                                userId)
                                .isPresent();

                if (!isParticipant) {
                        throw new ApiException(
                                        HttpStatus.FORBIDDEN,
                                        "You are not an active participant in this call.");
                }

                return callSession.getLivekitRoomName();
        }

        @Transactional
        public void handleParticipantLeftWebhook(
                        String roomName,
                        UUID userId,
                        Instant joinedAt,
                        Instant leftAt) {

                CallSession initialSession = callSessionRepository
                                .findByLivekitRoomNameAndStatus(
                                                roomName, CallStatus.ACTIVE)
                                .orElse(null);

                if (initialSession == null) {
                        return;
                }

                UUID serverId = initialSession.getServer().getId();

                if (serverRepository
                                .findByIdAndDeletedAtIsNullForUpdate(serverId)
                                .isEmpty()) {
                        return;
                }

                CallSession callSession = callSessionRepository
                                .findByLivekitRoomNameAndStatus(
                                                roomName, CallStatus.ACTIVE)
                                .orElse(null);

                if (callSession == null) {
                        return;
                }

                CallParticipation participation = callParticipationRepository
                        .findByCallSession_IdAndUser_IdAndJoinedAt(
                                callSession.getId(),
                                userId,
                                joinedAt)
                        .orElse(null);

                // true only when this event closes a connection we saw open.
                boolean closedOpenParticipation = participation != null
                        && participation.getLeftAt() == null;

                if (participation == null) {
                        // participant_left arrived before participant_joined.
                        // Record the completed participation immediately.
                        participation = new CallParticipation();
                        participation.setCallSession(callSession);
                        participation.setUser(
                                userAccountRepository.getReferenceById(userId));
                        participation.setJoinedAt(joinedAt);
                }

                if (participation.getLeftAt() == null) {
                        participation.setLeftAt(leftAt);
                        callParticipationRepository.save(participation);
                }

                // a sharer who disconnects must release the slot.
                if (closedOpenParticipation) {
                        clearSharerIfMatches(callSession, userId);
                }

                long remainingParticipants = callParticipationRepository
                                .countByCallSession_IdAndLeftAtIsNull(callSession.getId());

                if (remainingParticipants == 0) {
                        callSession.setStatus(CallStatus.ENDED);
                        callSession.setEndedAt(leftAt);
                        callSession.setActiveScreenSharer(null);
                        callSessionRepository.save(callSession);
                }
        }

        @Transactional
        public void handleRoomFinishedWebhook(String roomName) {

                CallSession initialSession = callSessionRepository
                                .findByLivekitRoomNameAndStatus(
                                                roomName,
                                                CallStatus.ACTIVE)
                                .orElse(null);

                if (initialSession == null) {
                        return;
                }

                UUID serverId = initialSession.getServer().getId();

                if (serverRepository
                                .findByIdAndDeletedAtIsNullForUpdate(serverId)
                                .isEmpty()) {
                        return;
                }

                CallSession callSession = callSessionRepository
                                .findByLivekitRoomNameAndStatus(
                                                roomName,
                                                CallStatus.ACTIVE)
                                .orElse(null);

                if (callSession == null) {
                        return;
                }

                Instant now = Instant.now();

                var activeParticipations = callParticipationRepository
                                .findAllByCallSession_IdAndLeftAtIsNullOrderByJoinedAtAsc(
                                                callSession.getId());

                activeParticipations.forEach(
                                participation -> participation.setLeftAt(now));

                callParticipationRepository.saveAll(activeParticipations);

                callSession.setStatus(CallStatus.ENDED);
                callSession.setEndedAt(now);
                callSession.setActiveScreenSharer(null);

                callSessionRepository.save(callSession);
        }

        /**
         * Records a participant only after LiveKit confirms the connection.
         */
        @Transactional
        public void handleParticipantJoinedWebhook(
                        String roomName,
                        UUID userId,
                        Instant joinedAt) {

                CallSession initialSession = callSessionRepository
                                .findByLivekitRoomNameAndStatus(
                                                roomName, CallStatus.ACTIVE)
                                .orElse(null);

                if (initialSession == null) {
                        return;
                }

                UUID serverId = initialSession.getServer().getId();

                if (serverRepository
                                .findByIdAndDeletedAtIsNullForUpdate(serverId)
                                .isEmpty()) {
                        return;
                }

                CallSession callSession = callSessionRepository
                                .findByLivekitRoomNameAndStatus(
                                                roomName, CallStatus.ACTIVE)
                                .orElse(null);

                if (callSession == null) {
                        return;
                }

                // The same connection may already have been recorded
                // by an out-of-order participant_left event.
                boolean participationExists = callParticipationRepository
                                .findByCallSession_IdAndUser_IdAndJoinedAt(
                                                callSession.getId(),
                                                userId,
                                                joinedAt)
                                .isPresent();

                if (participationExists) {
                        return;
                }

                // same user reconnected (rejoin / new tab). LiveKit has
                // already replaced the old connection, so close it here.
                CallParticipation previous = callParticipationRepository
                        .findByCallSession_IdAndUser_IdAndLeftAtIsNull(
                                callSession.getId(),
                                userId)
                        .orElse(null);

                if (previous != null) {
                        if (!previous.getJoinedAt().isBefore(joinedAt)) {
                                // Stale webhook of an older connection.
                                return;
                        }

                        previous.setLeftAt(joinedAt);
                        // Flush now: Hibernate runs INSERTs before UPDATEs,
                        // which would violate uq_call_participation_active.
                        callParticipationRepository.saveAndFlush(previous);

                        clearSharerIfMatches(callSession, userId);
                }

                CallParticipation participation = new CallParticipation();
                participation.setCallSession(callSession);
                participation.setUser(
                                userAccountRepository.getReferenceById(userId));
                participation.setJoinedAt(joinedAt);

                callParticipationRepository.save(participation);
        }
}
