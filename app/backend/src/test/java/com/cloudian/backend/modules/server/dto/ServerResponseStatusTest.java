package com.cloudian.backend.modules.server.dto;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.cloudian.backend.commons.enums.ServerMemberRole;
import com.cloudian.backend.commons.enums.ServerStatus;
import com.cloudian.backend.models.Server;

class ServerResponseStatusTest {

    @Test
    void includesTheServerLifecycleStatus() {
        Server server = new Server();
        server.setId(UUID.randomUUID());
        server.setName("Cloud Computing");
        server.setStatus(ServerStatus.LOCKED);

        ServerResponse response = ServerResponse.of(
                server,
                null,
                ServerMemberRole.OWNER,
                1);

        assertThat(response.status()).isEqualTo(ServerStatus.LOCKED);
    }
}
