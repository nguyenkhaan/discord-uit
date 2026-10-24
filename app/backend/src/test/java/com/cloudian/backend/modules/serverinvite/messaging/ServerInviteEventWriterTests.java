package com.cloudian.backend.modules.serverinvite.messaging;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import com.cloudian.backend.commons.enums.OutboxStatus;
import com.cloudian.backend.commons.enums.ServerMemberRole;
import com.cloudian.backend.models.OutboxEvent;
import com.cloudian.backend.models.Server;
import com.cloudian.backend.models.ServerMembership;
import com.cloudian.backend.models.UserAccount;
import com.cloudian.backend.repositories.OutboxEventRepository;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

class ServerInviteEventWriterTests {

    @Test
    void writesPendingMembershipCreatedEventWithMembershipIdentity() throws Exception {
        OutboxEventRepository outboxRepository = mock(OutboxEventRepository.class);
        JsonMapper jsonMapper = JsonMapper.builder().build();
        ServerInviteEventWriter eventWriter = new ServerInviteEventWriter(outboxRepository, jsonMapper);
        ServerMembership membership = membership();

        eventWriter.writeMembershipCreated(membership);

        ArgumentCaptor<OutboxEvent> eventCaptor = ArgumentCaptor.forClass(OutboxEvent.class);
        verify(outboxRepository).save(eventCaptor.capture());
        OutboxEvent outboxEvent = eventCaptor.getValue();
        assertThat(outboxEvent.getEntityType()).isEqualTo("SERVER_MEMBERSHIP");
        assertThat(outboxEvent.getEntityId()).isEqualTo(membership.getId());
        assertThat(outboxEvent.getEventType()).isEqualTo("SERVER_MEMBERSHIP_CREATED");
        assertThat(outboxEvent.getStatus()).isEqualTo(OutboxStatus.PENDING);

        JsonNode payload = jsonMapper.readTree(outboxEvent.getPayload());
        assertThat(payload.get("membershipId").stringValue()).isEqualTo(membership.getId().toString());
        assertThat(payload.get("serverId").stringValue()).isEqualTo(membership.getServer().getId().toString());
        assertThat(payload.get("userId").stringValue()).isEqualTo(membership.getUser().getId().toString());
        assertThat(payload.get("role").stringValue()).isEqualTo(ServerMemberRole.MEMBER.name());
    }

    private static ServerMembership membership() {
        Server server = new Server();
        server.setId(UUID.randomUUID());
        UserAccount user = new UserAccount();
        user.setId(UUID.randomUUID());
        ServerMembership membership = new ServerMembership();
        membership.setId(UUID.randomUUID());
        membership.setServer(server);
        membership.setUser(user);
        membership.setRole(ServerMemberRole.MEMBER);
        membership.setJoinedAt(Instant.parse("2026-10-25T00:00:00Z"));
        return membership;
    }
}
