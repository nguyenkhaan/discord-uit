package com.cloudian.backend.models;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import com.cloudian.backend.commons.enums.ServerStatus;

class ServerStatusTest {

    @Test
    void newServerDefaultsToActiveStatus() {
        Server server = new Server();

        assertThat(server.getStatus()).isEqualTo(ServerStatus.ACTIVE);
    }
}
