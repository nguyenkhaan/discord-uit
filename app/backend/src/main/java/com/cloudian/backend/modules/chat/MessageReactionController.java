
package com.cloudian.backend.modules.chat;

import java.util.UUID;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cloudian.backend.modules.chat.dto.AddMessageReactionRequest;
import com.cloudian.backend.modules.chat.dto.MessageReactionListResponse;
import com.cloudian.backend.security.CustomUserDetails;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/servers/{serverId}/messages/{messageId}/reactions")
@RequiredArgsConstructor
public class MessageReactionController {

    private final MessageReactionService reactionService;

    @PostMapping
    @PreAuthorize("@serverAccess.isMember(#serverId)")
    public MessageReactionListResponse addReaction(
            @PathVariable("serverId") UUID serverId,
            @PathVariable("messageId") UUID messageId,
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody AddMessageReactionRequest request) {

        return reactionService.addReaction(
                serverId,
                messageId,
                principal.getUserId(),
                request.iconId());
    }

    @DeleteMapping
    @PreAuthorize("@serverAccess.isMember(#serverId)")
    public MessageReactionListResponse removeReaction(
            @PathVariable("serverId") UUID serverId,
            @PathVariable("messageId") UUID messageId,
            @AuthenticationPrincipal CustomUserDetails principal) {

        return reactionService.removeReaction(
                serverId,
                messageId,
                principal.getUserId());
    }

    @GetMapping
    @PreAuthorize("@serverAccess.isMember(#serverId)")
    public MessageReactionListResponse getReactions(
            @PathVariable("serverId") UUID serverId,
            @PathVariable("messageId") UUID messageId,
            @AuthenticationPrincipal CustomUserDetails principal) {

        return reactionService.getReactions(
                serverId,
                messageId,
                principal.getUserId());
    }
}
