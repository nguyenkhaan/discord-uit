package com.cloudian.backend.services;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.util.Date;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import com.cloudian.backend.commons.constants.RedisKey;
import com.cloudian.backend.commons.enums.TokenType;
import com.cloudian.backend.utils.JwtUtil;

class AccessTokenRevocationServiceTests {

    private JwtUtil jwtUtil;
    private RedisService redisService;
    private AccessTokenRevocationService revocationService;

    @BeforeEach
    void setUp() {
        jwtUtil = mock(JwtUtil.class);
        redisService = mock(RedisService.class);
        revocationService = new AccessTokenRevocationService(jwtUtil, redisService);
    }

    @Test
    void revokeStoresOnlyTheTokenIdUntilTheAccessTokenExpires() {
        String accessToken = "signed-access-token";
        String tokenId = "token-id";
        when(jwtUtil.extractTokenId(accessToken, TokenType.ACCESS)).thenReturn(tokenId);
        when(jwtUtil.extractExpiration(accessToken, TokenType.ACCESS))
                .thenReturn(new Date(System.currentTimeMillis() + 60_000));

        revocationService.revoke(accessToken);

        ArgumentCaptor<Duration> ttlCaptor = ArgumentCaptor.forClass(Duration.class);
        verify(redisService).set(
                eq(RedisKey.revokedAccessToken(tokenId)),
                eq("1"),
                ttlCaptor.capture());
        assertThat(ttlCaptor.getValue()).isPositive().isLessThanOrEqualTo(Duration.ofSeconds(60));
    }

    @Test
    void reportsAStoredTokenIdAsRevoked() {
        when(jwtUtil.extractTokenId("signed-access-token", TokenType.ACCESS)).thenReturn("token-id");
        when(redisService.get(RedisKey.revokedAccessToken("token-id")))
                .thenReturn(Optional.of("1"));

        assertThat(revocationService.isRevoked("signed-access-token")).isTrue();
    }
}
