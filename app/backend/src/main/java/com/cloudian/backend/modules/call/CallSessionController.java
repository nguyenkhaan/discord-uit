
package com.cloudian.backend.modules.call;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.cloudian.backend.models.CallSession;
import com.cloudian.backend.modules.call.dto.ActiveCallResponse;
import com.cloudian.backend.modules.call.dto.CallSessionStartResponse;
import com.cloudian.backend.modules.call.dto.LiveKitJoinResponse;
import com.cloudian.backend.security.CustomUserDetails;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/servers/{serverId}/calls")
@RequiredArgsConstructor
public class CallSessionController {

    private final CallSessionLiveKitService callSessionLiveKitService;

    /**
     * Returns the active call of the server (participants, coordinator).
     * 204 No Content when there is no active call.
     */
    @GetMapping("/active")
    public ResponseEntity<ActiveCallResponse> getActiveCall(
            @PathVariable("serverId") UUID serverId,
            @AuthenticationPrincipal CustomUserDetails principal) {

        return callSessionLiveKitService
                .getActiveCall(serverId, principal.getUserId())
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    /**
     * Starts a new call in a server.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CallSessionStartResponse startCall(
            @PathVariable("serverId") UUID serverId,
            @AuthenticationPrincipal CustomUserDetails principal) {

        CallSession session = callSessionLiveKitService.startCall(
                serverId,
                principal.getUserId());

        return new CallSessionStartResponse(
                session.getId(),
                session.getLivekitRoomName(),
                session.getStatus(),
                session.getStartedAt());
    }

    /**
     * Joins the active call and returns a LiveKit access token.
     */
    @PostMapping("/join")
    public LiveKitJoinResponse joinCall(
            @PathVariable("serverId") UUID serverId,
            @AuthenticationPrincipal CustomUserDetails principal) {

        return callSessionLiveKitService.joinCall(
                serverId,
                principal.getUserId());
    }

    /**
     * Ends the active call.
     * Only the coordinator can perform this operation.
     */
    @PostMapping("/end")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void endCall(
            @PathVariable("serverId") UUID serverId,
            @AuthenticationPrincipal CustomUserDetails principal) {

        callSessionLiveKitService.endCall(
                serverId,
                principal.getUserId());
    }


    @PostMapping("/screen-share")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void startScreenShare(
            @PathVariable UUID serverId,
            @AuthenticationPrincipal CustomUserDetails principal) {

        callSessionLiveKitService.startScreenShare(serverId, principal.getUserId());
    }

    @DeleteMapping("/screen-share")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void stopScreenShare(
            @PathVariable UUID serverId,
            @AuthenticationPrincipal CustomUserDetails principal) {

        callSessionLiveKitService.stopScreenShare(serverId, principal.getUserId());
    }

    @PostMapping("/participants/{targetUserId}/force-mute")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void forceMute(
            @PathVariable UUID serverId,
            @PathVariable UUID targetUserId,
            @AuthenticationPrincipal CustomUserDetails principal) {

        callSessionLiveKitService.forceMute(
                serverId, principal.getUserId(), targetUserId);
    }

    @PostMapping("/participants/{targetUserId}/force-stop-screen-share")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void forceStopScreenShare(
            @PathVariable UUID serverId,
            @PathVariable UUID targetUserId,
            @AuthenticationPrincipal CustomUserDetails principal) {

        callSessionLiveKitService.forceStopScreenShare(
                serverId, principal.getUserId(), targetUserId);
    }
}
