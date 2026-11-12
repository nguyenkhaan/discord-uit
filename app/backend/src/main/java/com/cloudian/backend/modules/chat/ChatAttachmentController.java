package com.cloudian.backend.modules.chat;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.cloudian.backend.modules.chat.dto.ChatAttachmentResponse;
import com.cloudian.backend.security.CustomUserDetails;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/servers/{serverId}/attachments")
@RequiredArgsConstructor
public class ChatAttachmentController {

    private final ChatAttachmentService attachmentService;

    /** Upload 1 ảnh để gửi kèm tin nhắn */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("@serverAccess.isMember(#serverId)")
    @ResponseStatus(HttpStatus.CREATED)
    public ChatAttachmentResponse upload(
            @PathVariable("serverId") UUID serverId,
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestPart("file") MultipartFile file) {
        return attachmentService.upload(serverId, principal.getUserId(), file);
    }
}
