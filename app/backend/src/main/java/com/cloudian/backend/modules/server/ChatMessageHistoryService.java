
package com.cloudian.backend.modules.server;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cloudian.backend.exceptions.ApiException;
import com.cloudian.backend.models.ChatMessage;
import com.cloudian.backend.modules.chat.ChatAttachmentService;
import com.cloudian.backend.modules.chat.dto.ChatAttachmentResponse;
import com.cloudian.backend.modules.server.dto.ChatMessageCursor;
import com.cloudian.backend.modules.server.dto.ChatMessageHistoryItem;
import com.cloudian.backend.modules.server.dto.ChatMessageHistoryResponse;
import com.cloudian.backend.repositories.ChatMessageRepository;

@Service
public class ChatMessageHistoryService {

    private static final int MAX_LIMIT = 100;

    private static final String INVALID_CURSOR = "Invalid chat history cursor.";

    private final ChatMessageRepository chatMessageRepository;
    private final ChatAttachmentService attachmentService;

    public ChatMessageHistoryService(
            ChatMessageRepository chatMessageRepository,
            ChatAttachmentService attachmentService) {
        this.chatMessageRepository = chatMessageRepository;
        this.attachmentService = attachmentService;
    }

    @Transactional(readOnly = true)
    public ChatMessageHistoryResponse getHistory(
            UUID serverId,
            String before,
            int limit) {

        validateLimit(limit);

        List<ChatMessage> fetchedMessages;

        // First page: get the latest messages.
        if (before == null || before.isBlank()) {
            fetchedMessages = new ArrayList<>(
                    chatMessageRepository.findLatestByServerId(
                            serverId,
                            PageRequest.of(0, limit + 1)));
        } else {
            // Next pages: get messages older than the cursor.
            ChatMessageCursor cursor = decodeCursor(before);

            fetchedMessages = new ArrayList<>(
                    chatMessageRepository.findBeforeCursor(
                            serverId,
                            cursor.createdAt(),
                            cursor.id(),
                            PageRequest.of(0, limit + 1)));
        }

        // Fetching limit + 1 records tells us whether more data exists.
        boolean hasMore = fetchedMessages.size() > limit;

        if (hasMore) {
            fetchedMessages.remove(limit);
        }

        // The last message in the current page is the oldest one.
        String nextCursor = null;

        if (hasMore && !fetchedMessages.isEmpty()) {
            ChatMessage oldestMessage = fetchedMessages.get(fetchedMessages.size() - 1);

            nextCursor = encodeCursor(new ChatMessageCursor(
                    oldestMessage.getCreatedAt(),
                    oldestMessage.getId()));
        }

        // Lấy ảnh của cả trang trong 1 query, bỏ qua tin đã thu hồi
        Map<UUID, List<ChatAttachmentResponse>> attachments = attachmentService.findByMessageIds(
                fetchedMessages.stream()
                        .filter(message -> message.getDeletedAt() == null)
                        .map(ChatMessage::getId)
                        .toList());

        List<ChatMessageHistoryItem> items = fetchedMessages.stream()
                .map(message -> ChatMessageHistoryItem.from(
                        message,
                        attachments.getOrDefault(message.getId(), List.of())))
                .toList();

        return new ChatMessageHistoryResponse(
                items,
                nextCursor,
                hasMore);
    }

    /**
     * Encode createdAt and message id into an URL-safe Base64 cursor.
     */
    private String encodeCursor(ChatMessageCursor cursor) {
        String rawCursor = cursor.createdAt().toString()
                + "|"
                + cursor.id();

        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(
                        rawCursor.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Decode and validate the cursor received from the client.
     */
    private ChatMessageCursor decodeCursor(String encodedCursor) {
        try {
            byte[] decodedBytes = Base64.getUrlDecoder()
                    .decode(encodedCursor);

            String decoded = new String(
                    decodedBytes,
                    StandardCharsets.UTF_8);

            String[] parts = decoded.split("\\|", -1);

            if (parts.length != 2
                    || parts[0].isBlank()
                    || parts[1].isBlank()) {
                throw invalidCursor();
            }

            Instant createdAt = Instant.parse(parts[0]);
            UUID id = UUID.fromString(parts[1]);

            return new ChatMessageCursor(createdAt, id);

        } catch (IllegalArgumentException | DateTimeParseException exception) {
            throw invalidCursor();
        }
    }

    /**
     * Prevent invalid or excessively large history requests.
     */
    private void validateLimit(int limit) {
        if (limit < 1 || limit > MAX_LIMIT) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Limit must be between 1 and " + MAX_LIMIT + ".");
        }
    }

    private ApiException invalidCursor() {
        return new ApiException(
                HttpStatus.BAD_REQUEST,
                INVALID_CURSOR);
    }
}
