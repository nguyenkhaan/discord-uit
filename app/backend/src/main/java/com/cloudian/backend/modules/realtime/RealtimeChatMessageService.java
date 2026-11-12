package com.cloudian.backend.modules.realtime;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.cloudian.backend.exceptions.ApiException;
import com.cloudian.backend.models.ChatMessage;
import com.cloudian.backend.modules.realtime.dto.RealtimeChatMessageRequest;
import com.cloudian.backend.modules.realtime.dto.RealtimeChatMessageResponse;
import com.cloudian.backend.repositories.ServerMembershipRepository;

@Service
public class RealtimeChatMessageService {

    private static final int MAX_CONTENT_LENGTH = 2_000;
    private static final String SERVER_NOT_FOUND = "Server not found.";
    private static final String INVALID_MESSAGE = "Invalid chat message.";

    private final ServerMembershipRepository membershipRepository;
    private final ChatMessageWriter messageWriter;

    public RealtimeChatMessageService(
            ServerMembershipRepository membershipRepository,
            ChatMessageWriter messageWriter) {
        this.membershipRepository = membershipRepository;
        this.messageWriter = messageWriter;
    }

    public RealtimeChatMessageResponse createOrGet(
            UUID serverId,
            UUID senderUserId,
            RealtimeChatMessageRequest request) {
        String contentText = validateAndNormalize(request);

        membershipRepository
                .findActiveRole(serverId, senderUserId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        SERVER_NOT_FOUND));

        ChatMessage message = request.replyToMessageId() == null
                ? messageWriter.createOrGet(
                        serverId,
                        senderUserId,
                        request.clientRequestId(),
                        contentText)
                : messageWriter.createOrGet(
                        serverId,
                        senderUserId,
                        request.clientRequestId(),
                        contentText,
                        request.replyToMessageId());

        return RealtimeChatMessageResponse.from(message);
    }

    private String validateAndNormalize(RealtimeChatMessageRequest request) {
        if (request == null || request.clientRequestId() == null) {
            throw invalidMessage();
        }

        String contentText = request.contentText();

        if (contentText == null) {
            throw invalidMessage();
        }

        String normalizedContent = contentText.trim();

        if (normalizedContent.isEmpty()
                || normalizedContent.length() > MAX_CONTENT_LENGTH) {
            throw invalidMessage();
        }

        return normalizedContent;
    }

    private ApiException invalidMessage() {
        return new ApiException(HttpStatus.BAD_REQUEST, INVALID_MESSAGE);
    }
}
