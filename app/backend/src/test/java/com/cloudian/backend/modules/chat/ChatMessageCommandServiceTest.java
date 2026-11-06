package com.cloudian.backend.modules.chat;

import com.cloudian.backend.commons.enums.ServerMemberRole;
import com.cloudian.backend.exceptions.ApiException;
import com.cloudian.backend.models.ChatMessage;
import com.cloudian.backend.models.Server;
import com.cloudian.backend.models.UserAccount;
import com.cloudian.backend.modules.chat.dto.ChatMessageResponse;
import com.cloudian.backend.modules.chat.messaging.ChatMessageEventWriter;
import com.cloudian.backend.repositories.ChatMessageRepository;
import com.cloudian.backend.repositories.ServerMembershipRepository;
import com.cloudian.backend.repositories.UserAccountRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatMessageCommandServiceTests {

    private static final UUID SERVER_ID = UUID.fromString("0f8fad5b-d9cb-469f-a165-70867728950e");
    private static final UUID MESSAGE_ID = UUID.fromString("11111111-1111-4111-8111-111111111111");
    private static final UUID SENDER_ID = UUID.fromString("00000000-0000-4000-8000-000000000001");
    private static final UUID OTHER_ID = UUID.fromString("00000000-0000-4000-8000-000000000002");

    @Mock
    private ChatMessageRepository messageRepository;
    @Mock private ServerMembershipRepository membershipRepository;
    @Mock private UserAccountRepository userAccountRepository;
    @Mock private ChatMessageEventWriter eventWriter;

    @InjectMocks
    private ChatMessageCommandService service;

    @Test
    void senderCanEditOwnMessage() {
        ChatMessage message = message("old text");
        when(membershipRepository.findActiveRole(SERVER_ID, SENDER_ID))
                .thenReturn(Optional.of(ServerMemberRole.MEMBER));
        when(messageRepository.findByIdAndServerIdForUpdate(SERVER_ID, MESSAGE_ID))
                .thenReturn(Optional.of(message));

        ChatMessageResponse response = service.edit(SERVER_ID, MESSAGE_ID, SENDER_ID, "  new text  ");

        assertThat(response.contentText()).isEqualTo("new text");
        assertThat(response.editedAt()).isNotNull();
        verify(eventWriter).write(ChatMessageEventWriter.MESSAGE_UPDATED, response);
    }

    @Test
    void otherMemberCannotEdit() {
        ChatMessage message = message("old text");
        when(membershipRepository.findActiveRole(SERVER_ID, OTHER_ID))
                .thenReturn(Optional.of(ServerMemberRole.MEMBER));
        when(messageRepository.findByIdAndServerIdForUpdate(SERVER_ID, MESSAGE_ID))
                .thenReturn(Optional.of(message));

        assertThatThrownBy(() -> service.edit(SERVER_ID, MESSAGE_ID, OTHER_ID, "hack"))
                .isInstanceOfSatisfying(ApiException.class,
                        ex -> assertThat(ex.getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
        verifyNoInteractions(eventWriter);
    }

    private static ChatMessage message(String content) {
        Server server = new Server();
        server.setId(SERVER_ID);
        UserAccount sender = new UserAccount();
        sender.setId(SENDER_ID);
        ChatMessage message = new ChatMessage();
        message.setId(MESSAGE_ID);
        message.setServer(server);
        message.setSender(sender);
        message.setClientRequestId(UUID.randomUUID());
        message.setContentText(content);
        message.setCreatedAt(Instant.now());
        return message;
    }
}
