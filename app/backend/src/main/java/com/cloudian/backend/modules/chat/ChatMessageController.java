package com.cloudian.backend.modules.chat;

import java.util.UUID;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cloudian.backend.modules.chat.dto.ChatMessageResponse;
import com.cloudian.backend.modules.chat.dto.DeleteChatMessageRequest;
import com.cloudian.backend.modules.chat.dto.EditChatMessageRequest;
import com.cloudian.backend.security.CustomUserDetails;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/servers/{serverId}/messages")
@RequiredArgsConstructor
public class ChatMessageController {

    private final ChatMessageCommandService commandService;

    @PatchMapping("/{messageId}")
    @PreAuthorize("@serverAccess.isMember(#serverId)")
    public ChatMessageResponse edit(
            @PathVariable("serverId") UUID serverId,
            @PathVariable("messageId") UUID messageId,
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody EditChatMessageRequest request) {
        return commandService.edit(serverId, messageId, principal.getUserId(), request.contentText());
    }

    @DeleteMapping("/{messageId}")
    @PreAuthorize("@serverAccess.isMember(#serverId)")
    public ChatMessageResponse delete(
            @PathVariable("serverId") UUID serverId,
            @PathVariable("messageId") UUID messageId,
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody(required = false) DeleteChatMessageRequest request) {
        return commandService.delete(serverId, messageId, principal.getUserId(),
                request == null ? null : request.reason());
    }
}