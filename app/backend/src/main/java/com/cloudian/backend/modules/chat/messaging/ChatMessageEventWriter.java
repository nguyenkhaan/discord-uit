package com.cloudian.backend.modules.chat.messaging;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.cloudian.backend.models.OutboxEvent;
import com.cloudian.backend.modules.chat.dto.ChatMessageResponse;
import com.cloudian.backend.repositories.OutboxEventRepository;

import lombok.RequiredArgsConstructor;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

/*
* Ghi lại các sự kiện xóa, sửa vào outbox để relay gọi lại khi gateway lỗi hoặc timeout
* */


@Component
@RequiredArgsConstructor
public class ChatMessageEventWriter {

    private static final String ENTITY_TYPE = "CHAT_MESSAGE";
    public static final String MESSAGE_UPDATED = "CHAT_MESSAGE_UPDATED";
    public static final String MESSAGE_DELETED = "CHAT_MESSAGE_DELETED";

    private final OutboxEventRepository outboxEventRepository;
    private final JsonMapper jsonMapper;

    @Transactional(propagation = Propagation.MANDATORY)
    public void write(String eventType, ChatMessageResponse payload) {
        OutboxEvent outboxEvent = new OutboxEvent();
        outboxEvent.setEntityType(ENTITY_TYPE);
        outboxEvent.setEntityId(payload.messageId());
        outboxEvent.setEventType(eventType);
        outboxEvent.setPayload(serialize(payload));
        outboxEventRepository.save(outboxEvent);
    }

    private String serialize(ChatMessageResponse payload) {
        try {
            return jsonMapper.writeValueAsString(payload);
        } catch (JacksonException exception) {
            throw new IllegalStateException("Could not serialize chat message outbox event.", exception);
        }
    }
}