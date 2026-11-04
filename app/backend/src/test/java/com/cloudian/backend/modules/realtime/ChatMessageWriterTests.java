package com.cloudian.backend.modules.realtime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.TransactionStatus;

import com.cloudian.backend.models.ChatMessage;
import com.cloudian.backend.models.Server;
import com.cloudian.backend.models.UserAccount;
import com.cloudian.backend.repositories.ChatMessageRepository;
import com.cloudian.backend.repositories.ServerRepository;
import com.cloudian.backend.repositories.UserAccountRepository;

@SuppressWarnings("unchecked")
class ChatMessageWriterTests {

    private final UUID serverId = UUID.randomUUID();
    private final UUID senderUserId = UUID.randomUUID();
    private final UUID clientRequestId = UUID.randomUUID();
    private final ChatMessageRepository messageRepository =
            mock(ChatMessageRepository.class);
    private final ServerRepository serverRepository =
            mock(ServerRepository.class);
    private final UserAccountRepository userAccountRepository =
            mock(UserAccountRepository.class);
    private final PlatformTransactionManager transactionManager =
            mock(PlatformTransactionManager.class);
    private final TransactionStatus transactionStatus =
            mock(TransactionStatus.class);
    private ChatMessageWriter messageWriter;

    @BeforeEach
    void setUp() {
        when(transactionManager.getTransaction(any(TransactionDefinition.class)))
                .thenReturn(transactionStatus);
        messageWriter = new ChatMessageWriter(
                messageRepository,
                serverRepository,
                userAccountRepository,
                transactionManager);
    }

    @Test
    void returnsAnExistingMessageWithoutStartingAnInsertTransaction() {
        ChatMessage existing = message();
        when(messageRepository.findByServer_IdAndSender_IdAndClientRequestId(
                serverId,
                senderUserId,
                clientRequestId))
                .thenReturn(Optional.of(existing));

        ChatMessage result = messageWriter.createOrGet(
                serverId,
                senderUserId,
                clientRequestId,
                "Hello");

        assertThat(result).isSameAs(existing);
        verify(transactionManager, never())
                .getTransaction(any(TransactionDefinition.class));
        verifyNoInteractions(serverRepository, userAccountRepository);
    }

    @Test
    void insertsANewMessageInItsOwnTransaction() {
        Server server = new Server();
        server.setId(serverId);
        UserAccount sender = new UserAccount();
        sender.setId(senderUserId);
        when(messageRepository.findByServer_IdAndSender_IdAndClientRequestId(
                serverId,
                senderUserId,
                clientRequestId))
                .thenReturn(Optional.empty());
        when(serverRepository.getReferenceById(serverId)).thenReturn(server);
        when(userAccountRepository.getReferenceById(senderUserId)).thenReturn(sender);
        when(messageRepository.saveAndFlush(any(ChatMessage.class)))
                .thenAnswer(invocation -> invocation.<ChatMessage>getArgument(0));

        ChatMessage result = messageWriter.createOrGet(
                serverId,
                senderUserId,
                clientRequestId,
                "Hello");

        assertThat(result.getServer()).isSameAs(server);
        assertThat(result.getSender()).isSameAs(sender);
        assertThat(result.getClientRequestId()).isEqualTo(clientRequestId);
        assertThat(result.getContentText()).isEqualTo("Hello");
        verify(transactionManager).commit(transactionStatus);
    }

    @Test
    void returnsTheWinningRowAfterAConcurrentUniqueConflict() {
        ChatMessage winningMessage = message();
        when(messageRepository.findByServer_IdAndSender_IdAndClientRequestId(
                serverId,
                senderUserId,
                clientRequestId))
                .thenReturn(Optional.empty(), Optional.of(winningMessage));
        when(messageRepository.saveAndFlush(any(ChatMessage.class)))
                .thenThrow(new DataIntegrityViolationException("duplicate"));

        ChatMessage result = messageWriter.createOrGet(
                serverId,
                senderUserId,
                clientRequestId,
                "Hello");

        assertThat(result).isSameAs(winningMessage);
        verify(transactionManager).rollback(transactionStatus);
    }

    private ChatMessage message() {
        ChatMessage message = new ChatMessage();
        message.setId(UUID.randomUUID());
        message.setClientRequestId(clientRequestId);
        return message;
    }
}
