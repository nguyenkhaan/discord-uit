package com.cloudian.backend.utils;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Component;

import com.cloudian.backend.commons.constants.AppConstant;
import com.cloudian.backend.commons.enums.SystemRole;
import com.cloudian.backend.commons.enums.TokenType;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtUtil {
    private final String accessSecret = "my-super-secret-key-that-is-at-least-32-characters-long";
    private final String refreshSecret = "my-super-refresh-key-that-is-at-least-32-characters-long";

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
        if (type == TokenType.REFRESH)
            return Keys.hmacShaKeyFor(
                    refreshSecret.getBytes(StandardCharsets.UTF_8));
        return Keys.hmacShaKeyFor(
                accessSecret.getBytes(StandardCharsets.UTF_8));
    }
    // headers = authenticationService.

    public Claims extractAllClaims(String token, TokenType type) {
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

    private String createToken(Map<String, Object> claims, String subject, TokenType type) {
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .id(UUID.randomUUID().toString())
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis()
                        + (type == TokenType.ACCESS ? AppConstant.accessTokenTTL : AppConstant.refreshTokenTTL))) // 10
                                                                                                                  // gio
                .signWith(secretKey(type))
                .compact();
    }

    private Boolean isTokenExpired(String token, TokenType type) {
        return extractExpiration(token, type).before(new Date());
    }

    public Boolean validateToken(String token, String username, TokenType type) {
        final String extractedUsername = extractUsername(token, type);
        return (extractedUsername.equals(username) && !isTokenExpired(token, type));
    }

    public String createAccessToken(UUID userId, SystemRole role, UUID sessionId) {
    Map<String, Object> claims = new HashMap<>();
    claims.put("role", role.name());
    claims.put("sid", sessionId.toString());
    return createToken(claims, userId.toString(), TokenType.ACCESS);
}

public String createRefreshToken(UUID userId, UUID sessionId) {
    Map<String, Object> claims = new HashMap<>();
    claims.put("sid", sessionId.toString());
    return createToken(claims, userId.toString(), TokenType.REFRESH);
}
}
