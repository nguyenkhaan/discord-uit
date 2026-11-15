
package com.cloudian.backend.modules.chat.events;

import java.util.List;

import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.cloudian.backend.modules.chat.RealtimeGatewayClient;
import com.cloudian.backend.modules.chat.RealtimeGatewayClient.ReactionPayload;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class MessageReactionEventListener {

    private final RealtimeGatewayClient gatewayClient;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleMessageReactionChanged(
            MessageReactionChangedEvent event) {

        var response = event.reactionResponse();

        List<ReactionPayload> reactions = response.reactions()
                .stream()
                .map(reaction -> new ReactionPayload(
                        reaction.iconId(),
                        reaction.iconImage(),
                        reaction.name(),
                        reaction.count()))
                .toList();

        try {
            gatewayClient.notifyMessageReactionUpdated(
                    event.serverId(),
                    response.messageId(),
                    reactions);
        } catch (Exception exception) {
            log.error(
                    "Failed to notify Gateway about message reaction update. serverId={}, messageId={}",
                    event.serverId(),
                    response.messageId(),
                    exception);
        }
    }
}
