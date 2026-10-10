package com.cloudian.backend.utils;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.cloudian.backend.commons.constants.AppConstant;
import com.cloudian.backend.commons.enums.TokenType;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtUtil {

    private final String accessSecret = "my-super-secret-key-that-is-at-least-32-characters-long";
    private final String refreshSecret = "my-super-refresh-key-that-is-at-least-32-characters-long";
    private final String emailVerificationSecret;
    private final long emailVerificationTtlMillis;

    public JwtUtil(
            @Value("${app.jwt.email-verification-secret}") String emailVerificationSecret,
            @Value("${app.jwt.email-verification-ttl:PT48H}") Duration emailVerificationTtl
    ) {
        this.emailVerificationSecret = emailVerificationSecret;
        this.emailVerificationTtlMillis = emailVerificationTtl.toMillis();
    }

    public String extractUsername(String token, TokenType type) {
        return extractClaim(token, Claims::getSubject, type);
    }

    public Date extractExpiration(String token, TokenType type) {
        return extractClaim(token, Claims::getExpiration, type);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver, TokenType type) {
        final Claims claims = extractAllClaims(token, type);
        return claimsResolver.apply(claims);
    }

    private SecretKey secretKey(TokenType type) {
        String secret = switch (type) {
            case ACCESS -> accessSecret;
            case REFRESH -> refreshSecret;
            case EMAIL_VERIFICATION -> emailVerificationSecret;
        };
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    private Claims extractAllClaims(String token, TokenType type) {
        return Jwts.parser()
                .verifyWith(secretKey(type))
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

    public String generateEmailVerificationToken(String userId) {
        return createToken(Map.of(), userId, TokenType.EMAIL_VERIFICATION);
    }

    private String createToken(Map<String, Object> claims, String subject, TokenType type) {
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + tokenTtlMillis(type)))
                .signWith(secretKey(type))
                .compact();
    }

    private long tokenTtlMillis(TokenType type) {
        return switch (type) {
            case ACCESS -> AppConstant.accessTokenTTL;
            case REFRESH -> AppConstant.refreshTokenTTL;
            case EMAIL_VERIFICATION -> emailVerificationTtlMillis;
        };
    }
    private Boolean isTokenExpired(String token, TokenType type) {
        return extractExpiration(token, type).before(new Date());
    }

    public Boolean validateToken(String token, String username, TokenType type) {
        final String extractedUsername = extractUsername(token, type);
        return extractedUsername.equals(username) && !isTokenExpired(token, type);
    }
}
