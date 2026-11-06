package com.cloudian.backend.modules.chat;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cloudian.backend.commons.enums.ServerMemberRole;
import com.cloudian.backend.exceptions.ApiException;
import com.cloudian.backend.models.ChatMessage;
import com.cloudian.backend.modules.chat.dto.ChatMessageResponse;
import com.cloudian.backend.modules.chat.messaging.ChatMessageEventWriter;
import com.cloudian.backend.repositories.ChatMessageRepository;
import com.cloudian.backend.repositories.ServerMembershipRepository;
import com.cloudian.backend.repositories.UserAccountRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ChatMessageCommandService {

    private static final int MAX_CONTENT_LENGTH = 2_000;
    private static final int MAX_REASON_LENGTH = 255;
    private static final Duration PURGE_AFTER = Duration.ofDays(90);

    private final ChatMessageRepository messageRepository;
    private final ServerMembershipRepository membershipRepository;
    private final UserAccountRepository userAccountRepository;
    private final ChatMessageEventWriter eventWriter;

    @Transactional
    public ChatMessageResponse edit(UUID serverId, UUID messageId, UUID userId, String rawContent) {
        String content = normalizeContent(rawContent);
        requireActiveRole(serverId, userId);
        ChatMessage message = loadForUpdate(serverId, messageId);

        if (!message.getSender().getId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only the sender can edit this message.");
        }
        if (message.getDeletedAt() != null) {
            throw new ApiException(HttpStatus.CONFLICT, "Message has been deleted.");
        }
        if (content.equals(message.getContentText())) {
            return ChatMessageResponse.from(message); // không đổi gì thì không ghi outbox
        }

        message.setContentText(content);
        message.setEditedAt(Instant.now());
        ChatMessageResponse response = ChatMessageResponse.from(message);
        eventWriter.write(ChatMessageEventWriter.MESSAGE_UPDATED, response);
        return response;
    }

    @Transactional
    public ChatMessageResponse delete(UUID serverId, UUID messageId, UUID userId, String reason) {
        ServerMemberRole requesterRole = requireActiveRole(serverId, userId);
        ChatMessage message = loadForUpdate(serverId, messageId);

        UUID senderId = message.getSender().getId();
        boolean isSender = senderId.equals(userId);

        // Kiểm tra quyền xem có được xóa tin nhắn không
        if (!isSender) {
            if (requesterRole != ServerMemberRole.OWNER) {
                throw new ApiException(HttpStatus.FORBIDDEN, "You cannot delete this message.");
            }
            boolean senderIsActiveOwner = membershipRepository
                    .existsByServer_IdAndUser_IdAndRoleAndLeftAtIsNull(
                            serverId, senderId, ServerMemberRole.OWNER);
            if (senderIsActiveOwner) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Cannot remove another owner's message.");
            }
        }

        // Khi message đã xóa rồi thì chỉ trả về trạng thái, deletedAt vẫn ghi như kết quả cũ
        if (message.getDeletedAt() != null) {
            return ChatMessageResponse.from(message);
        }

        // Khi owner xóa tin thì cần lý do
        String storedReason = isSender ? null : normalizeReason(reason);
        Instant now = Instant.now();
        message.setDeletedAt(now);
        message.setDeletedBy(userAccountRepository.getReferenceById(userId));
        message.setDeletionReason(storedReason);
        message.setPurgeAt(now.plus(PURGE_AFTER));

        ChatMessageResponse response = ChatMessageResponse.from(message);
        eventWriter.write(ChatMessageEventWriter.MESSAGE_DELETED, response);
        return response;
    }

    private ServerMemberRole requireActiveRole(UUID serverId, UUID userId) {
        return membershipRepository.findActiveRole(serverId, userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Server not found."));
    }

    private ChatMessage loadForUpdate(UUID serverId, UUID messageId) {
        return messageRepository.findByIdAndServerIdForUpdate(serverId, messageId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Message not found."));
    }

    private String normalizeContent(String raw) {
        String content = raw == null ? "" : raw.trim();
        if (content.isEmpty() || content.length() > MAX_CONTENT_LENGTH) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid chat message.");
        }
        return content;
    }

    private String normalizeReason(String raw) {
        String reason = raw == null ? "" : raw.trim();
        if (reason.isEmpty() || reason.length() > MAX_REASON_LENGTH) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "A valid reason is required.");
        }
        return reason;
    }
}