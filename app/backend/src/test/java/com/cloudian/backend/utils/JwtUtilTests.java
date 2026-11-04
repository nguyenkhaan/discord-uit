package com.cloudian.backend.utils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.security.KeyPair;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.time.Duration;

import org.junit.jupiter.api.Test;

import com.cloudian.backend.commons.enums.TokenType;
import com.cloudian.backend.security.AccessTokenKeyProvider;

import io.jsonwebtoken.Jwts;

class JwtUtilTests {

    private static final String TEST_SECRET =
            "test-email-verification-secret-that-is-long-enough-for-hmac";
    private static final String TEST_ISSUER = "test-issuer";
    private static final String TEST_AUDIENCE = "test-audience";
    private static final String TEST_KEY_ID = "test-access-key";

    private final JwtUtil jwtUtil = createJwtUtil();

    @Test
    void generatedAccessTokensHaveDistinctIdentifiers() {
        String firstToken = jwtUtil.generateToken("user-id", "user@example.com")[0];
        String secondToken = jwtUtil.generateToken("user-id", "user@example.com")[0];

        String firstTokenId = jwtUtil.extractTokenId(firstToken, TokenType.ACCESS);
        String secondTokenId = jwtUtil.extractTokenId(secondToken, TokenType.ACCESS);

        assertThat(firstTokenId).isNotBlank();
        assertThat(secondTokenId).isNotBlank().isNotEqualTo(firstTokenId);
    }

    private static JwtUtil createJwtUtil() {
        KeyPair keyPair = Jwts.SIG.RS256.keyPair().build();
        AccessTokenKeyProvider keyProvider = mock(AccessTokenKeyProvider.class);
        when(keyProvider.privateKey()).thenReturn((RSAPrivateKey) keyPair.getPrivate());
        when(keyProvider.publicKey()).thenReturn((RSAPublicKey) keyPair.getPublic());
        when(keyProvider.keyId()).thenReturn(TEST_KEY_ID);

        return new JwtUtil(
                keyProvider,
                TEST_SECRET,
                TEST_SECRET,
                Duration.ofHours(1),
                TEST_ISSUER,
                TEST_AUDIENCE);
    }
}
