package com.cloudian.backend.modules.serverinvite.messaging;

import org.springframework.stereotype.Component;

import com.cloudian.backend.models.OutboxEvent;
import com.cloudian.backend.models.ServerMembership;
import com.cloudian.backend.repositories.OutboxEventRepository;

import lombok.RequiredArgsConstructor;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

@Component
@RequiredArgsConstructor
public class ServerInviteEventWriter {

    private static final String ENTITY_TYPE = "SERVER_MEMBERSHIP";
    private static final String EVENT_TYPE = "SERVER_MEMBERSHIP_CREATED";

    private final OutboxEventRepository outboxEventRepository;
    private final JsonMapper jsonMapper;

    public void writeMembershipCreated(ServerMembership membership) {
        ServerMembershipCreatedEvent event = ServerMembershipCreatedEvent.from(membership);
        OutboxEvent outboxEvent = new OutboxEvent();
        outboxEvent.setEntityType(ENTITY_TYPE);
        outboxEvent.setEntityId(membership.getId());
        outboxEvent.setEventType(EVENT_TYPE);
        outboxEvent.setPayload(serialize(event));
        outboxEventRepository.save(outboxEvent);
    }

    private String serialize(ServerMembershipCreatedEvent event) {
        try {
            return jsonMapper.writeValueAsString(event);
        } catch (JacksonException exception) {
            throw new IllegalStateException("Could not serialize membership outbox event.", exception);
        }
    }
}
