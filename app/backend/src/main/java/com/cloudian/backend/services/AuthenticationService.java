package com.cloudian.backend.services;

import java.time.Instant;
import java.util.UUID;

import com.cloudian.backend.exceptions.GlobalExceptionHandler;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;

import com.cloudian.backend.commons.constants.AppConstant;
import com.cloudian.backend.commons.enums.AccountStatus;
import com.cloudian.backend.commons.enums.TokenType;
import com.cloudian.backend.exceptions.ApiException;
import com.cloudian.backend.modules.auth.dto.LoginResponse;
import com.cloudian.backend.modules.auth.entity.RefreshSession;
import com.cloudian.backend.modules.auth.entity.UserAccount;
import com.cloudian.backend.modules.auth.repository.RefreshSessionRepository;
import com.cloudian.backend.modules.auth.repository.UserAccountRepository;
import com.cloudian.backend.utils.JwtUtil;
import com.cloudian.backend.utils.TokenHasher;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthenticationService {
    private static final String INVALID_CREDENTIALS = "Email or password is incorrect.";
    private static final String INVALID_REFRESH = "The refresh token is invalid or expired.";

    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final UserAccountRepository userRepository;
    private final RefreshSessionRepository sessionRepository;

    @Transactional
    public LoginResponse login(String email, String password) {
        Authentication auth;
        try {
            auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password));
        } catch (AuthenticationException e) {
            throw new ApiException(401, INVALID_CREDENTIALS);
        }
        CustomUserDetails d = (CustomUserDetails) auth.getPrincipal();
        if (d.getStatus() != AccountStatus.ACTIVE) { // UNVERIFIED, BANNED
            throw new ApiException(401, INVALID_CREDENTIALS); // cùng message
        }

        UUID sid = UUID.randomUUID();
        String refreshToken = jwtUtil.createRefreshToken(d.getUserId(), sid);

        RefreshSession s = new RefreshSession();
        s.setId(sid);
        s.setUserId(d.getUserId());
        s.setTokenHash(TokenHasher.sha256(refreshToken));
        s.setCreatedAt(Instant.now());
        s.setExpiresAt(Instant.now().plusMillis(AppConstant.refreshTokenTTL));
        sessionRepository.save(s);

        return new LoginResponse(jwtUtil.createAccessToken(d.getUserId(), d.getRole(), sid), refreshToken);
    }

    // noRollbackFor: để việc thu hồi session khi phát hiện dùng lại token không bị
    // rollback khi ném lỗi
    @Transactional(noRollbackFor = ApiException.class)
    public LoginResponse refresh(String refreshToken) {
        UUID sid;
        UUID userId;
        try {
            Claims c = jwtUtil.extractAllClaims(refreshToken, TokenType.REFRESH);
            sid = UUID.fromString(c.get("sid", String.class));
            userId = UUID.fromString(c.getSubject());
        } catch (JwtException | IllegalArgumentException | NullPointerException e) {
            throw new ApiException(401, INVALID_REFRESH);
        }

        RefreshSession s = sessionRepository.findById(sid)
                .orElseThrow(() -> new ApiException(401, INVALID_REFRESH));
        Instant now = Instant.now();
        if (s.getRevokedAt() != null || s.getExpiresAt().isBefore(now) || !s.getUserId().equals(userId)) {
            throw new ApiException(401, INVALID_REFRESH);
        }
        if (!s.getTokenHash().equals(TokenHasher.sha256(refreshToken))) {
            s.setRevokedAt(now); // token cũ bị dùng lại => nghi bị đánh cắp, thu hồi cả session
            throw new ApiException(401, INVALID_REFRESH);
        }

        UserAccount user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(401, INVALID_REFRESH));
        if (user.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new ApiException(401, INVALID_REFRESH);
        }

        String newRefresh = jwtUtil.createRefreshToken(userId, sid); // xoay vòng refresh token
        s.setTokenHash(TokenHasher.sha256(newRefresh));
        return new LoginResponse(jwtUtil.createAccessToken(userId, user.getSystemRole(), sid), newRefresh);
    }

    @Transactional
    public void logout(UUID sessionId) {
        sessionRepository.revokeById(sessionId, Instant.now());
    }

    @Transactional
    public void logoutAll(UUID userId) {
        sessionRepository.revokeAllByUserId(userId, Instant.now());
    }
}
