package com.cloudian.backend.modules.server;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.mockito.ArgumentCaptor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.cloudian.backend.commons.enums.ServerMemberRole;
import com.cloudian.backend.commons.enums.ServerStatus;
import com.cloudian.backend.exceptions.ApiException;
import com.cloudian.backend.models.Server;
import com.cloudian.backend.models.ServerMembership;
import com.cloudian.backend.modules.server.dto.CreateServerRequest;
import com.cloudian.backend.modules.server.dto.ServerResponse;
import com.cloudian.backend.modules.server.dto.ServerStatusCountResponse;
import com.cloudian.backend.repositories.ServerMembershipRepository;
import com.cloudian.backend.repositories.ServerRepository;
import com.cloudian.backend.repositories.UserAccountRepository;
import com.cloudian.backend.services.ImageUploadService;
import com.cloudian.backend.services.StorageService;

@ExtendWith(MockitoExtension.class)
class ServerStatusServiceTests {

    @Mock
    private ServerRepository serverRepository;

    @Mock
    private ServerMembershipRepository membershipRepository;

    @Mock
    private UserAccountRepository userAccountRepository;

    @Mock
    private ImageUploadService imageUploadService;

    @Mock
    private StorageService storageService;

    private ServerService serverService;

    @BeforeEach
    void setUp() {
        serverService = new ServerService(
                serverRepository,
                membershipRepository,
                userAccountRepository,
                imageUploadService,
                storageService);
    }

    @Test
    void listMineFiltersServersByRequestedStatus() {
        UUID userId = UUID.randomUUID();
        Server activeServer = server(ServerStatus.ACTIVE);
        Server lockedServer = server(ServerStatus.LOCKED);
        when(membershipRepository.findActiveByUserId(userId)).thenReturn(List.of(
                membership(activeServer),
                membership(lockedServer)));
        when(membershipRepository.countActiveByServerIds(List.of(
                lockedServer.getId()))).thenReturn(List.of(
                new ServerMemberCount(lockedServer.getId(), 2)));

        List<ServerResponse> response = serverService.listMine(
                userId,
                Set.of(ServerStatus.LOCKED));

        assertThat(response)
                .extracting(ServerResponse::status)
                .containsExactly(ServerStatus.LOCKED);
    }

    @Test
    void countMineByStatusIncludesZeroForRequestedStatuses() {
        UUID userId = UUID.randomUUID();
        when(membershipRepository.findActiveByUserId(userId)).thenReturn(List.of(
                membership(server(ServerStatus.ACTIVE)),
                membership(server(ServerStatus.ACTIVE)),
                membership(server(ServerStatus.LOCKED))));

        List<ServerStatusCountResponse> response = serverService.countMineByStatus(
                userId,
                Set.of(ServerStatus.ACTIVE, ServerStatus.CLOSED));

        assertThat(response).containsExactly(
                new ServerStatusCountResponse(ServerStatus.ACTIVE, 2),
                new ServerStatusCountResponse(ServerStatus.CLOSED, 0));
    }

    @Test
    void updateStatusChangesTheServerWhenCallerIsOwner() {
        UUID serverId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        Server server = server(ServerStatus.ACTIVE);
        server.setId(serverId);
        when(serverRepository.findByIdAndDeletedAtIsNullForUpdate(serverId))
                .thenReturn(Optional.of(server));
        when(membershipRepository.existsByServer_IdAndUser_IdAndRoleAndLeftAtIsNull(
                serverId,
                ownerId,
                ServerMemberRole.OWNER)).thenReturn(true);
        when(membershipRepository.countByServerIdAndLeftAtIsNull(serverId)).thenReturn(1L);

        ServerResponse response = serverService.updateStatus(
                serverId,
                ownerId,
                ServerStatus.CLOSED);

        assertThat(server.getStatus()).isEqualTo(ServerStatus.CLOSED);
        assertThat(response.status()).isEqualTo(ServerStatus.CLOSED);
    }

    @Test
    void updateStatusRejectsNonOwners() {
        UUID serverId = UUID.randomUUID();
        UUID memberId = UUID.randomUUID();
        Server server = server(ServerStatus.ACTIVE);
        server.setId(serverId);
        when(serverRepository.findByIdAndDeletedAtIsNullForUpdate(serverId))
                .thenReturn(Optional.of(server));
        when(membershipRepository.existsByServer_IdAndUser_IdAndRoleAndLeftAtIsNull(
                serverId,
                memberId,
                ServerMemberRole.OWNER)).thenReturn(false);

        assertThatThrownBy(() -> serverService.updateStatus(
                serverId,
                memberId,
                ServerStatus.CLOSED))
                .isInstanceOf(ApiException.class)
                .hasMessage("Only server owners can change server status.");

        assertThat(server.getStatus()).isEqualTo(ServerStatus.ACTIVE);
    }

    @Test
    void createTrimsDescriptionBeforeSavingTheServer() {
        UUID userId = UUID.randomUUID();

        serverService.create(userId, new CreateServerRequest(
                "Cloud Computing",
                "  Tài nguyên và thảo luận về điện toán đám mây.  ",
                null));

        ArgumentCaptor<Server> savedServer = ArgumentCaptor.forClass(Server.class);
        verify(serverRepository).save(savedServer.capture());
        assertThat(savedServer.getValue().getDescription())
                .isEqualTo("Tài nguyên và thảo luận về điện toán đám mây.");
    }

    @Test
    void createNormalizesWhitespaceOnlyDescriptionToNull() {
        UUID userId = UUID.randomUUID();

        serverService.create(userId, new CreateServerRequest("Cloud Computing", "   ", null));

        ArgumentCaptor<Server> savedServer = ArgumentCaptor.forClass(Server.class);
        verify(serverRepository).save(savedServer.capture());
        assertThat(savedServer.getValue().getDescription()).isNull();
    }

    @Test
    void createTrimsUnicodeWhitespaceFromDescription() {
        UUID userId = UUID.randomUUID();

        serverService.create(userId, new CreateServerRequest(
                "Cloud Computing",
                "\u2003Tài nguyên và thảo luận về điện toán đám mây.\u00a0",
                null));

        ArgumentCaptor<Server> savedServer = ArgumentCaptor.forClass(Server.class);
        verify(serverRepository).save(savedServer.capture());
        assertThat(savedServer.getValue().getDescription())
                .isEqualTo("Tài nguyên và thảo luận về điện toán đám mây.");
    }

    @Test
    void createNormalizesNonBreakingSpaceOnlyDescriptionToNull() {
        UUID userId = UUID.randomUUID();

        serverService.create(userId, new CreateServerRequest("Cloud Computing", "\u00a0", null));

        ArgumentCaptor<Server> savedServer = ArgumentCaptor.forClass(Server.class);
        verify(serverRepository).save(savedServer.capture());
        assertThat(savedServer.getValue().getDescription()).isNull();
    }

    private static Server server(ServerStatus status) {
        Server server = new Server();
        server.setId(UUID.randomUUID());
        server.setName("Server");
        server.setStatus(status);
        return server;
    }

    private static ServerMembership membership(Server server) {
        ServerMembership membership = new ServerMembership();
        membership.setServer(server);
        membership.setRole(ServerMemberRole.MEMBER);
        return membership;
    }
}
