
package com.cloudian.backend.modules.call;

import java.time.Instant;
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
        private static final int MAX_PARTICIPANTS = 30;

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

                // 5. Prevent the same user from joining the same call twice.
                boolean alreadyJoined = callParticipationRepository
                                .findByCallSession_IdAndUser_IdAndLeftAtIsNull(
                                                callSession.getId(),
                                                userId)
                                .isPresent();

                if (alreadyJoined) {
                        throw new ApiException(
                                        HttpStatus.CONFLICT,
                                        "You are already in this call.");
                }

                // 6. Check the participant limit.
                long participantCount = callParticipationRepository
                                .countByCallSession_IdAndLeftAtIsNull(callSession.getId());

                if (participantCount >= MAX_PARTICIPANTS) {
                        throw new ApiException(
                                        HttpStatus.CONFLICT,
                                        "This call has reached its participant limit.");
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
         * Starts screen sharing for an active call participant.
         */
        @Transactional
        public void startScreenShare(UUID serverId, UUID userId) {

                // 1. Lock the server to serialize concurrent operations.
                serverRepository
                                .findByIdAndDeletedAtIsNullForUpdate(serverId)
                                .orElseThrow(CallSessionService::serverNotFound);

                // 2. Find the active call.
                CallSession callSession = callSessionRepository
                                .findByServer_IdAndStatus(serverId, CallStatus.ACTIVE)
                                .orElseThrow(() -> new ApiException(
                                                HttpStatus.NOT_FOUND,
                                                "No active call found in this server."));

                // 3. Verify that the user is participating in this call.
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

                // 4. Only one participant can share the screen at a time.
                if (callSession.getActiveScreenSharer() != null) {
                        throw new ApiException(
                                        HttpStatus.CONFLICT,
                                        "Someone is already sharing their screen.");
                }

                // 5. Update the active screen sharer.
                callSession.setActiveScreenSharer(
                                userAccountRepository.getReferenceById(userId));

                callSessionRepository.save(callSession);

                // 6. Record the screen sharing event.
                callEventService.recordEvent(
                                serverId,
                                userId,
                                null,
                                CallEventType.SCREEN_SHARE_STARTED);
        }

        /**
         * Stops screen sharing for the current screen sharer.
         */
        @Transactional
        public void stopScreenShare(UUID serverId, UUID userId) {

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

                // 3. Verify that a participant is currently sharing.
                UserAccount activeSharer = callSession.getActiveScreenSharer();

                if (activeSharer == null) {
                        throw new ApiException(
                                        HttpStatus.CONFLICT,
                                        "No one is currently sharing their screen.");
                }

                // 4. Only the current screen sharer can stop their own sharing.
                if (!activeSharer.getId().equals(userId)) {
                        throw new ApiException(
                                        HttpStatus.FORBIDDEN,
                                        "Only the current screen sharer can stop sharing.");
                }

                // 5. Clear the active screen sharer.
                callSession.setActiveScreenSharer(null);

                callSessionRepository.save(callSession);

                // 6. Record the stop event.
                callEventService.recordEvent(
                                serverId,
                                userId,
                                null,
                                CallEventType.SCREEN_SHARE_STOPPED);
        }

        /**
         * Records an owner's request to force mute a participant.
         */
        @Transactional
        public void forceMute(
                        UUID serverId,
                        UUID actorUserId,
                        UUID targetUserId) {

                // 1. Lock the server.
                serverRepository
                                .findByIdAndDeletedAtIsNullForUpdate(serverId)
                                .orElseThrow(CallSessionService::serverNotFound);

                // 2. Verify that the actor is an active OWNER.
                requireOwner(serverId, actorUserId);

                // 3. Record the force mute event.
                // CallEventService also verifies that both users
                // are active participants in the call.
                callEventService.recordEvent(
                                serverId,
                                actorUserId,
                                targetUserId,
                                CallEventType.FORCE_MUTE);
        }

        /**
         * Allows an owner to force the current screen sharer to stop sharing.
         */
        @Transactional
        public void forceStopScreenShare(
                        UUID serverId,
                        UUID actorUserId,
                        UUID targetUserId) {

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

                // 3. Verify that the actor is an active OWNER.
                requireOwner(serverId, actorUserId);

                // 4. Validate the target user.
                if (targetUserId == null) {
                        throw new ApiException(
                                        HttpStatus.BAD_REQUEST,
                                        "Target user is required.");
                }

                // 5. Check whether someone is currently sharing.
                UserAccount activeSharer = callSession.getActiveScreenSharer();

                if (activeSharer == null) {
                        throw new ApiException(
                                        HttpStatus.CONFLICT,
                                        "No one is currently sharing their screen.");
                }

                // 6. The target must be the current screen sharer.
                if (!activeSharer.getId().equals(targetUserId)) {
                        throw new ApiException(
                                        HttpStatus.CONFLICT,
                                        "The target user is not currently sharing their screen.");
                }

                // 7. Clear the current screen sharer.
                callSession.setActiveScreenSharer(null);
                callSessionRepository.save(callSession);

                // 8. Record the force stop event.
                callEventService.recordEvent(
                                serverId,
                                actorUserId,
                                targetUserId,
                                CallEventType.FORCE_SCREEN_SHARE_STOP);
        }

        private void requireOwner(UUID serverId, UUID userId) {

                ServerMemberRole role = serverMembershipRepository
                                .findActiveRole(serverId, userId)
                                .orElseThrow(() -> new ApiException(
                                                HttpStatus.FORBIDDEN,
                                                "Only active server owners can control this call."));

                if (role != ServerMemberRole.OWNER) {
                        throw new ApiException(
                                        HttpStatus.FORBIDDEN,
                                        "Only active server owners can control this call.");
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

                // Do not create another active participation for this user.
                boolean alreadyActive = callParticipationRepository
                                .findByCallSession_IdAndUser_IdAndLeftAtIsNull(
                                                callSession.getId(),
                                                userId)
                                .isPresent();

                if (alreadyActive) {
                        return;
                }

                CallParticipation participation = new CallParticipation();
                participation.setCallSession(callSession);
                participation.setUser(
                                userAccountRepository.getReferenceById(userId));
                participation.setJoinedAt(joinedAt);

                callParticipationRepository.save(participation);
        }
}
