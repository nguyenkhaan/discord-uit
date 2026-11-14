
package com.cloudian.backend.modules.chat;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cloudian.backend.exceptions.ApiException;
import com.cloudian.backend.models.ChatMessage;
import com.cloudian.backend.modules.chat.dto.MessageReactionItemResponse;
import com.cloudian.backend.modules.chat.dto.MessageReactionListResponse;
import com.cloudian.backend.repositories.ChatMessageRepository;
import com.cloudian.backend.repositories.MessageReactionRepository;
import com.cloudian.backend.repositories.ReactIconRepository;
import com.cloudian.backend.repositories.ServerMembershipRepository;
import org.springframework.context.ApplicationEventPublisher;
import com.cloudian.backend.modules.chat.events.MessageReactionChangedEvent;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MessageReactionService {

    private final ChatMessageRepository messageRepository;
    private final ServerMembershipRepository membershipRepository;
    private final ReactIconRepository reactIconRepository;
    private final MessageReactionRepository reactionRepository;
    private final ApplicationEventPublisher eventPublisher;

    /**
     * Add a reaction or replace the user's existing reaction.
     */
    @Transactional
    public MessageReactionListResponse addReaction(
            UUID serverId,
            UUID messageId,
            UUID userId,
            UUID iconId) {

        requireActiveMember(serverId, userId);

        ChatMessage message = loadForUpdate(serverId, messageId);
        validateMessageNotDeleted(message);

        if (!reactIconRepository.existsById(iconId)) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid reaction icon.");
        }

        reactionRepository.upsertReaction(messageId, userId, iconId);

        MessageReactionListResponse response = buildReactionResponse(messageId, userId);

        eventPublisher.publishEvent(
                new MessageReactionChangedEvent(serverId, response));

        return response;
    }

    /**
     * Remove the user's reaction from a message.
     */
    @Transactional
    public MessageReactionListResponse removeReaction(
            UUID serverId,
            UUID messageId,
            UUID userId) {

        requireActiveMember(serverId, userId);

        ChatMessage message = loadForUpdate(serverId, messageId);
        validateMessageNotDeleted(message);

        reactionRepository.deleteReaction(messageId, userId);

        MessageReactionListResponse response = buildReactionResponse(messageId, userId);

        eventPublisher.publishEvent(
                new MessageReactionChangedEvent(serverId, response));

        return response;
    }

    /**
     * Get reaction aggregates of a message.
     */
    @Transactional(readOnly = true)
    public MessageReactionListResponse getReactions(
            UUID serverId,
            UUID messageId,
            UUID userId) {

        requireActiveMember(serverId, userId);

        ChatMessage message = messageRepository
                .findByIdAndServer_Id(messageId, serverId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Message not found."));

        validateMessageNotDeleted(message);

        return buildReactionResponse(messageId, userId);
    }

    /**
     * Ensure the user is an active member of the server.
     */
    private void requireActiveMember(UUID serverId, UUID userId) {
        membershipRepository.findActiveRole(serverId, userId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Server not found."));
    }

    /**
     * Load a message with pessimistic write lock.
     */
    private ChatMessage loadForUpdate(UUID serverId, UUID messageId) {
        return messageRepository.findByIdAndServerIdForUpdate(
                serverId,
                messageId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Message not found."));
    }

    /**
     * Ensure the message has not been deleted.
     */
    private void validateMessageNotDeleted(ChatMessage message) {
        if (message.getDeletedAt() != null) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Message has been deleted.");
        }
    }

    /**
     * Build the current reaction state of a message.
     */
    private MessageReactionListResponse buildReactionResponse(
            UUID messageId,
            UUID userId) {

        List<MessageReactionItemResponse> reactions = reactionRepository
                .findAggregatesByMessageIdAndUserId(messageId, userId)
                .stream()
                .map(MessageReactionItemResponse::from)
                .toList();

        return new MessageReactionListResponse(
                messageId,
                reactions);
    }
}
