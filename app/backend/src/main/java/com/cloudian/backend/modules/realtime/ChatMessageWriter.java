package com.cloudian.backend.modules.realtime;

import java.util.Objects;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import com.cloudian.backend.models.ChatMessage;
import com.cloudian.backend.repositories.ChatMessageRepository;
import com.cloudian.backend.repositories.ServerRepository;
import com.cloudian.backend.repositories.UserAccountRepository;

@Component
public class ChatMessageWriter {

    private final ChatMessageRepository messageRepository;
    private final ServerRepository serverRepository;
    private final UserAccountRepository userAccountRepository;
    private final TransactionTemplate insertTransaction;

    public ChatMessageWriter(
            ChatMessageRepository messageRepository,
            ServerRepository serverRepository,
            UserAccountRepository userAccountRepository,
            PlatformTransactionManager transactionManager) {
        this.messageRepository = messageRepository;
        this.serverRepository = serverRepository;
        this.userAccountRepository = userAccountRepository;
        this.insertTransaction = new TransactionTemplate(transactionManager);
        this.insertTransaction.setPropagationBehavior(
                TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    public ChatMessage createOrGet(
            UUID serverId,
            UUID senderUserId,
            UUID clientRequestId,
            String contentText) {
        return messageRepository
                .findByServer_IdAndSender_IdAndClientRequestId(
                        serverId,
                        senderUserId,
                        clientRequestId)
                .orElseGet(() -> insertOrFindExisting(
                        serverId,
                        senderUserId,
                        clientRequestId,
                        contentText));
    }

    private ChatMessage insertOrFindExisting(
            UUID serverId,
            UUID senderUserId,
            UUID clientRequestId,
            String contentText) {
        try {
            ChatMessage inserted = insertTransaction.execute(status -> {
                ChatMessage message = new ChatMessage();
                message.setServer(serverRepository.getReferenceById(serverId));
                message.setSender(userAccountRepository.getReferenceById(senderUserId));
                message.setClientRequestId(clientRequestId);
                message.setContentText(contentText);
                return messageRepository.saveAndFlush(message);
            });

            return Objects.requireNonNull(
                    inserted,
                    "Insert transaction returned no chat message");
        } catch (DataIntegrityViolationException exception) {
            return messageRepository
                    .findByServer_IdAndSender_IdAndClientRequestId(
                            serverId,
                            senderUserId,
                            clientRequestId)
                    .orElseThrow(() -> exception);
        }
    }
}
