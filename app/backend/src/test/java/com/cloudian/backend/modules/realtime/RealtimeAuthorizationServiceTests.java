package com.cloudian.backend.modules.realtime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import com.cloudian.backend.commons.enums.ServerMemberRole;
import com.cloudian.backend.exceptions.ApiException;
import com.cloudian.backend.modules.realtime.dto.RealtimeServerAuthorizationResponse;
import com.cloudian.backend.repositories.ServerMembershipRepository;

class RealtimeAuthorizationServiceTests {

    private final ServerMembershipRepository membershipRepository =
            mock(ServerMembershipRepository.class);
    private final RealtimeAuthorizationService authorizationService =
            new RealtimeAuthorizationService(membershipRepository);

    @Test
    void authorizesAnActiveMember() {
        UUID serverId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        when(membershipRepository.findActiveRole(serverId, userId))
                .thenReturn(Optional.of(ServerMemberRole.MEMBER));

        RealtimeServerAuthorizationResponse response =
                authorizationService.authorizeServer(serverId, userId);

        assertThat(response.serverId()).isEqualTo(serverId);
        assertThat(response.role()).isEqualTo(ServerMemberRole.MEMBER);
    }

    @Test
    void authorizesAnActiveOwner() {
        UUID serverId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        when(membershipRepository.findActiveRole(serverId, userId))
                .thenReturn(Optional.of(ServerMemberRole.OWNER));

        RealtimeServerAuthorizationResponse response =
                authorizationService.authorizeServer(serverId, userId);

        assertThat(response.role()).isEqualTo(ServerMemberRole.OWNER);
    }

    @Test
    void hidesMissingInactiveAndDeletedMembershipsBehindNotFound() {
        UUID serverId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        when(membershipRepository.findActiveRole(serverId, userId))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> authorizationService.authorizeServer(serverId, userId))
                .isInstanceOfSatisfying(ApiException.class, exception -> {
                    assertThat(exception.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(exception.getMessage()).isEqualTo("Server not found.");
                });
    }
}
