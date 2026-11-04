package com.cloudian.backend.modules.realtime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import com.cloudian.backend.commons.enums.ServerMemberRole;
import com.cloudian.backend.exceptions.ApiException;
import com.cloudian.backend.models.ChatMessage;
import com.cloudian.backend.models.Server;
import com.cloudian.backend.models.UserAccount;
import com.cloudian.backend.modules.realtime.dto.RealtimeChatMessageRequest;
import com.cloudian.backend.modules.realtime.dto.RealtimeChatMessageResponse;
import com.cloudian.backend.repositories.ServerMembershipRepository;

@ExtendWith(MockitoExtension.class)
class RealtimeChatMessageServiceTests {

    private static final UUID SERVER_ID = UUID.fromString(
            "0f8fad5b-d9cb-469f-a165-70867728950e");
    private static final UUID SENDER_USER_ID = UUID.fromString(
            "00000000-0000-4000-8000-000000000001");
    private static final UUID CLIENT_REQUEST_ID = UUID.fromString(
            "7c9e6679-7425-40de-944b-e07fc1f90ae7");

    @Mock
    private ServerMembershipRepository membershipRepository;

    @Mock
    private ChatMessageWriter messageWriter;

    @InjectMocks
    private RealtimeChatMessageService messageService;

    @Test
    void createsAChatMessageForAnActiveMember() {
        ChatMessage savedMessage = message("Hello realtime");
        when(membershipRepository.findActiveRole(SERVER_ID, SENDER_USER_ID))
                .thenReturn(Optional.of(ServerMemberRole.MEMBER));
        when(messageWriter.createOrGet(
                SERVER_ID,
                SENDER_USER_ID,
                CLIENT_REQUEST_ID,
                "Hello realtime"))
                .thenReturn(savedMessage);

        RealtimeChatMessageResponse response = messageService.createOrGet(
                SERVER_ID,
                SENDER_USER_ID,
                new RealtimeChatMessageRequest(CLIENT_REQUEST_ID, "  Hello realtime  "));

        assertThat(response.messageId()).isEqualTo(savedMessage.getId());
        assertThat(response.serverId()).isEqualTo(SERVER_ID);
        assertThat(response.senderUserId()).isEqualTo(SENDER_USER_ID);
        assertThat(response.clientRequestId()).isEqualTo(CLIENT_REQUEST_ID);
        assertThat(response.contentText()).isEqualTo("Hello realtime");
        assertThat(response.createdAt()).isEqualTo(savedMessage.getCreatedAt());
    }

    @Test
    void hidesInactiveMembershipBehindNotFoundWithoutWriting() {
        when(membershipRepository.findActiveRole(SERVER_ID, SENDER_USER_ID))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> messageService.createOrGet(
                SERVER_ID,
                SENDER_USER_ID,
                new RealtimeChatMessageRequest(CLIENT_REQUEST_ID, "Hello")))
                .isInstanceOfSatisfying(ApiException.class, exception -> {
                    assertThat(exception.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(exception.getMessage()).isEqualTo("Server not found.");
                });

        verifyNoInteractions(messageWriter);
    }

    @Test
    void rejectsBlankContentBeforeCheckingMembershipOrWriting() {
        assertThatThrownBy(() -> messageService.createOrGet(
                SERVER_ID,
                SENDER_USER_ID,
                new RealtimeChatMessageRequest(CLIENT_REQUEST_ID, "   ")))
                .isInstanceOfSatisfying(ApiException.class, exception ->
                        assertThat(exception.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));

        verifyNoInteractions(membershipRepository, messageWriter);
    }

    @Test
    void rejectsContentLongerThanTwoThousandCharactersWithoutWriting() {
        assertThatThrownBy(() -> messageService.createOrGet(
                SERVER_ID,
                SENDER_USER_ID,
                new RealtimeChatMessageRequest(CLIENT_REQUEST_ID, "a".repeat(2_001))))
                .isInstanceOfSatisfying(ApiException.class, exception ->
                        assertThat(exception.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));

        verify(membershipRepository, never()).findActiveRole(any(), any());
        verifyNoInteractions(messageWriter);
    }

    private static ChatMessage message(String contentText) {
        Server server = new Server();
        server.setId(SERVER_ID);
        UserAccount sender = new UserAccount();
        sender.setId(SENDER_USER_ID);

        ChatMessage message = new ChatMessage();
        message.setId(UUID.fromString("9b2c7f47-6d8e-4a23-b417-3b741fca8790"));
        message.setServer(server);
        message.setSender(sender);
        message.setClientRequestId(CLIENT_REQUEST_ID);
        message.setContentText(contentText);
        message.setCreatedAt(Instant.parse("2026-11-05T02:30:00Z"));
        return message;
    }
}
