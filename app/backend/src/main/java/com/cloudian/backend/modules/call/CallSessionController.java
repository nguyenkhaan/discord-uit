
package com.cloudian.backend.modules.call;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

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
}
