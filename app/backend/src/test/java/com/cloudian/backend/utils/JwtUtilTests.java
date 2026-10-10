package com.cloudian.backend.utils;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;

import org.junit.jupiter.api.Test;

import com.cloudian.backend.commons.enums.TokenType;

class JwtUtilTests {

    private static final String TEST_SECRET =
            "test-email-verification-secret-that-is-long-enough-for-hmac";

    private final JwtUtil jwtUtil = new JwtUtil(TEST_SECRET, Duration.ofHours(1));

    @Test
    void generatedAccessTokensHaveDistinctIdentifiers() {
        String firstToken = jwtUtil.generateToken("user-id", "user@example.com")[0];
        String secondToken = jwtUtil.generateToken("user-id", "user@example.com")[0];

        String firstTokenId = jwtUtil.extractTokenId(firstToken, TokenType.ACCESS);
        String secondTokenId = jwtUtil.extractTokenId(secondToken, TokenType.ACCESS);

        assertThat(firstTokenId).isNotBlank();
        assertThat(secondTokenId).isNotBlank().isNotEqualTo(firstTokenId);
    }
}
