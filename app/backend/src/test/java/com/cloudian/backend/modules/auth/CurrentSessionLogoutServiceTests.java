package com.cloudian.backend.modules.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import com.cloudian.backend.commons.enums.TokenType;
import com.cloudian.backend.exceptions.ApiException;
import com.cloudian.backend.models.RefreshSession;
import com.cloudian.backend.models.UserAccount;
import com.cloudian.backend.repositories.RefreshSessionRepository;
import com.cloudian.backend.services.AccessTokenRevocationService;
import com.cloudian.backend.utils.JwtUtil;
import com.cloudian.backend.utils.TokenHashUtil;

class CurrentSessionLogoutServiceTests {

    private JwtUtil jwtUtil;
    private RefreshSessionRepository refreshSessionRepository;
    private AccessTokenRevocationService accessTokenRevocationService;
    private CurrentSessionLogoutService logoutService;

    @BeforeEach
    void setUp() {
        jwtUtil = mock(JwtUtil.class);
        refreshSessionRepository = mock(RefreshSessionRepository.class);
        accessTokenRevocationService = mock(AccessTokenRevocationService.class);
        logoutService = new CurrentSessionLogoutService(
                jwtUtil,
                refreshSessionRepository,
                accessTokenRevocationService);
    }

    @Test
    void logoutRevokesTheCurrentRefreshSessionAndAccessToken() {
        UUID userId = UUID.randomUUID();
        RefreshSession session = activeSession(userId);
        when(jwtUtil.extractUsername("access-token", TokenType.ACCESS)).thenReturn(userId.toString());
        when(jwtUtil.extractTokenId("access-token", TokenType.ACCESS)).thenReturn("access-jti");
        when(jwtUtil.extractUsername("refresh-token", TokenType.REFRESH)).thenReturn(userId.toString());
        when(refreshSessionRepository.findByTokenHash(TokenHashUtil.sha256Hex("refresh-token")))
                .thenReturn(Optional.of(session));

        logoutService.logout(userId, "access-token", "refresh-token");

        assertThat(session.getRevokedAt()).isNotNull();
        verify(refreshSessionRepository).saveAndFlush(session);
        verify(accessTokenRevocationService).revoke("access-token");
    }

    @Test
    void logoutRejectsARefreshSessionOwnedByAnotherUser() {
        UUID authenticatedUserId = UUID.randomUUID();
        RefreshSession session = activeSession(UUID.randomUUID());
        when(jwtUtil.extractUsername("access-token", TokenType.ACCESS))
                .thenReturn(authenticatedUserId.toString());
        when(jwtUtil.extractTokenId("access-token", TokenType.ACCESS)).thenReturn("access-jti");
        when(jwtUtil.extractUsername("refresh-token", TokenType.REFRESH))
                .thenReturn(authenticatedUserId.toString());
        when(refreshSessionRepository.findByTokenHash(TokenHashUtil.sha256Hex("refresh-token")))
                .thenReturn(Optional.of(session));

        assertThatThrownBy(() -> logoutService.logout(
                authenticatedUserId,
                "access-token",
                "refresh-token"))
                .isInstanceOfSatisfying(ApiException.class, exception ->
                        assertThat(exception.getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED));

        assertThat(session.getRevokedAt()).isNull();
        verify(refreshSessionRepository, never()).saveAndFlush(session);
        verify(accessTokenRevocationService, never()).revoke("access-token");
    }

    private RefreshSession activeSession(UUID userId) {
        UserAccount user = new UserAccount();
        user.setId(userId);
        RefreshSession session = new RefreshSession();
        session.setUser(user);
        session.setExpiresAt(Instant.now().plusSeconds(60));
        return session;
    }
}
