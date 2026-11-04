package com.cloudian.backend.utils;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.cloudian.backend.commons.constants.AppConstant;
import com.cloudian.backend.commons.enums.TokenType;
import com.cloudian.backend.security.AccessTokenKeyProvider;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtBuilder;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtUtil {

    private final AccessTokenKeyProvider accessTokenKeys;
    private final SecretKey refreshKey;
    private final SecretKey emailVerificationKey;
    private final String accessIssuer;
    private final String accessAudience;
    private final long emailVerificationTtlMillis;

    public JwtUtil(
            AccessTokenKeyProvider accessTokenKeys,
            @Value("${app.jwt.refresh-secret}") String refreshSecret,
            @Value("${app.jwt.email-verification-secret}") String emailVerificationSecret,
            @Value("${app.jwt.email-verification-ttl:PT48H}") Duration emailVerificationTtl,
            @Value("${app.jwt.access-issuer}") String accessIssuer,
            @Value("${app.jwt.access-audience}") String accessAudience) {
        this.accessTokenKeys = accessTokenKeys;
        this.refreshKey = createHmacKey(refreshSecret, "Refresh-token secret");
        this.emailVerificationKey = createHmacKey(
                emailVerificationSecret,
                "Email-verification secret");
        this.accessIssuer = requireText(accessIssuer, "Access-token issuer");
        this.accessAudience = requireText(accessAudience, "Access-token audience");
        this.emailVerificationTtlMillis = emailVerificationTtl.toMillis();
    }

    public String extractUsername(String token, TokenType type) {
        return extractClaim(token, Claims::getSubject, type);
    }

    public Date extractExpiration(String token, TokenType type) {
        return extractClaim(token, Claims::getExpiration, type);
    }

    public String extractTokenId(String token, TokenType type) {
        return extractClaim(token, Claims::getId, type);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver, TokenType type) {
        final Claims claims = extractAllClaims(token, type);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token, TokenType type) {
        return switch (type) {
            case ACCESS -> Jwts.parser()
                    .verifyWith(accessTokenKeys.publicKey())
                    .requireIssuer(accessIssuer)
                    .requireAudience(accessAudience)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            case REFRESH -> parseHmacToken(token, refreshKey);
            case EMAIL_VERIFICATION -> parseHmacToken(token, emailVerificationKey);
        };
    }

    private Claims parseHmacToken(String token, SecretKey key) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String[] generateToken(String userId, String username) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("username", username);

        String accessToken = createToken(claims, userId, TokenType.ACCESS);
        String refreshToken = createToken(claims, userId, TokenType.REFRESH);
        return new String[] { accessToken, refreshToken };
    }

    public String[] generateToken(
            String userId,
            String username,
            String systemRole,
            String sessionId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("username", username);
        claims.put("system_role", systemRole);
        claims.put("sid", sessionId);

        String accessToken = createToken(claims, userId, TokenType.ACCESS);
        String refreshToken = createToken(claims, userId, TokenType.REFRESH);

        return new String[] { accessToken, refreshToken };
    }

    public String generateEmailVerificationToken(String userId) {
        return createToken(Map.of(), userId, TokenType.EMAIL_VERIFICATION);
    }

    private String createToken(Map<String, Object> claims, String subject, TokenType type) {
        return switch (type) {
            case ACCESS -> createAccessToken(claims, subject);
            case REFRESH -> createHmacToken(claims, subject, refreshKey, type);
            case EMAIL_VERIFICATION -> createHmacToken(
                    claims,
                    subject,
                    emailVerificationKey,
                    type);
        };
    }

    private String createAccessToken(Map<String, Object> claims, String subject) {
        long now = System.currentTimeMillis();

        return Jwts.builder()
                .header()
                .keyId(accessTokenKeys.keyId())
                .and()
                .id(UUID.randomUUID().toString())
                .claims(claims)
                .issuer(accessIssuer)
                .audience()
                .add(accessAudience)
                .and()
                .subject(subject)
                .issuedAt(new Date(now))
                .expiration(new Date(now + tokenTtlMillis(TokenType.ACCESS)))
                .signWith(accessTokenKeys.privateKey(), Jwts.SIG.RS256)
                .compact();
    }

    private String createHmacToken(
            Map<String, Object> claims,
            String subject,
            SecretKey key,
            TokenType type) {
        long now = System.currentTimeMillis();

        JwtBuilder builder = Jwts.builder()
                .id(UUID.randomUUID().toString())
                .claims(claims)
                .subject(subject)
                .issuedAt(new Date(now))
                .expiration(new Date(now + tokenTtlMillis(type)));

        return builder.signWith(key).compact();
    }

    private long tokenTtlMillis(TokenType type) {
        return switch (type) {
            case ACCESS -> AppConstant.accessTokenTTL;
            case REFRESH -> AppConstant.refreshTokenTTL;
            case EMAIL_VERIFICATION -> emailVerificationTtlMillis;
        };
    }

    private boolean isTokenExpired(String token, TokenType type) {
        return extractExpiration(token, type).before(new Date());
    }

    public boolean validateToken(String token, String username, TokenType type) {
        final String extractedUsername = extractUsername(token, type);
        return extractedUsername.equals(username) && !isTokenExpired(token, type);
    }

    private static SecretKey createHmacKey(String secret, String name) {
        String configuredSecret = requireText(secret, name);
        return Keys.hmacShaKeyFor(configuredSecret.getBytes(StandardCharsets.UTF_8));
    }

    private static String requireText(String value, String name) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(name + " must be configured.");
        }
        return value;
    }
}
