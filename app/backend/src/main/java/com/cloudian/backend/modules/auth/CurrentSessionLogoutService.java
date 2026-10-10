package com.cloudian.backend.modules.auth;

import java.time.Instant;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cloudian.backend.commons.enums.TokenType;
import com.cloudian.backend.exceptions.ApiException;
import com.cloudian.backend.models.RefreshSession;
import com.cloudian.backend.repositories.RefreshSessionRepository;
import com.cloudian.backend.services.AccessTokenRevocationService;
import com.cloudian.backend.utils.JwtUtil;
import com.cloudian.backend.utils.TokenHashUtil;

import io.jsonwebtoken.JwtException;

@Service
public class CurrentSessionLogoutService {

    private static final String INVALID_TOKEN_MESSAGE =
            "The access or refresh token is invalid or expired.";

    private final JwtUtil jwtUtil;
    private final RefreshSessionRepository refreshSessionRepository;
    private final AccessTokenRevocationService accessTokenRevocationService;

    public CurrentSessionLogoutService(
            JwtUtil jwtUtil,
            RefreshSessionRepository refreshSessionRepository,
            AccessTokenRevocationService accessTokenRevocationService
    ) {
        this.jwtUtil = jwtUtil;
        this.refreshSessionRepository = refreshSessionRepository;
        this.accessTokenRevocationService = accessTokenRevocationService;
    }

    @Transactional
    public void logout(UUID userId, String accessToken, String refreshToken) {
        validateTokenOwnership(userId, accessToken, refreshToken);

        Instant now = Instant.now();
        RefreshSession session = refreshSessionRepository
                .findByTokenHash(TokenHashUtil.sha256Hex(refreshToken))
                .filter(candidate -> userId.equals(candidate.getUser().getId()))
                .filter(candidate -> candidate.getRevokedAt() == null)
                .filter(candidate -> candidate.getExpiresAt().isAfter(now))
                .orElseThrow(CurrentSessionLogoutService::invalidToken);

        session.setRevokedAt(now);
        refreshSessionRepository.saveAndFlush(session);
        accessTokenRevocationService.revoke(accessToken);
    }

    private void validateTokenOwnership(UUID userId, String accessToken, String refreshToken) {
        try {
            String accessSubject = jwtUtil.extractUsername(accessToken, TokenType.ACCESS);
            String accessTokenId = jwtUtil.extractTokenId(accessToken, TokenType.ACCESS);
            String refreshSubject = jwtUtil.extractUsername(refreshToken, TokenType.REFRESH);
            if (!userId.toString().equals(accessSubject)
                    || accessTokenId == null
                    || accessTokenId.isBlank()
                    || !userId.toString().equals(refreshSubject)) {
                throw invalidToken();
            }
        } catch (JwtException | IllegalArgumentException exception) {
            throw invalidToken();
        }
    }

    private static ApiException invalidToken() {
        return new ApiException(HttpStatus.UNAUTHORIZED, INVALID_TOKEN_MESSAGE);
    }
}
