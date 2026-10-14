package com.cloudian.backend.modules.user;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cloudian.backend.commons.constants.RedisKey;
import com.cloudian.backend.commons.enums.AccountType;
import com.cloudian.backend.exceptions.ApiException;
import com.cloudian.backend.models.UserAccount;
import com.cloudian.backend.modules.user.dto.ChangePasswordRequest;
import com.cloudian.backend.repositories.RefreshSessionRepository;
import com.cloudian.backend.repositories.UserAccountRepository;
import com.cloudian.backend.services.EmailService;
import com.cloudian.backend.services.RedisService;

/**
 * Password change for a signed-in user: re-entering the current password is the proof,
 * so no email code is needed. Wrong attempts are rate-limited.
 */
@Service
public class PasswordChangeService {

    private static final Logger LOGGER = LoggerFactory.getLogger(PasswordChangeService.class);

    private static final String UIT_ACCOUNT_MESSAGE = "UIT accounts sign in with SSO and have no password.";
    private static final String WRONG_PASSWORD_MESSAGE = "The current password is incorrect.";
    private static final String SAME_PASSWORD_MESSAGE = "The new password must be different from the current one.";
    private static final String TOO_MANY_ATTEMPTS_MESSAGE = "Too many wrong attempts. Please try again later.";

    private final UserAccountRepository userAccountRepository;
    private final RefreshSessionRepository refreshSessionRepository;
    private final RedisService redisService;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final int maxAttempts;
    private final Duration attemptWindow;

    public PasswordChangeService(
            UserAccountRepository userAccountRepository,
            RefreshSessionRepository refreshSessionRepository,
            RedisService redisService,
            EmailService emailService,
            PasswordEncoder passwordEncoder,
            @Value("${app.password-change.max-attempts:5}") int maxAttempts,
            @Value("${app.password-change.attempt-window:PT15M}") Duration attemptWindow
    ) {
        this.userAccountRepository = userAccountRepository;
        this.refreshSessionRepository = refreshSessionRepository;
        this.redisService = redisService;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
        this.maxAttempts = maxAttempts;
        this.attemptWindow = attemptWindow;
    }

    @Transactional
    public void change(UUID userId, ChangePasswordRequest request) {
        UserAccount user = userAccountRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Authentication is required."));

        if (user.getAccountType() != AccountType.PERSONAL || user.getPasswordHash() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, UIT_ACCOUNT_MESSAGE);
        }

        String attemptsKey = RedisKey.passwordChangeAttempts(userId.toString());
        long attempts = redisService.get(attemptsKey).map(Long::parseLong).orElse(0L);
        if (attempts >= maxAttempts) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, TOO_MANY_ATTEMPTS_MESSAGE);
        }

        // 400, not 401: a wrong password must not make the frontend think the access token expired.
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            redisService.increment(attemptsKey, attemptWindow);
            throw new ApiException(HttpStatus.BAD_REQUEST, WRONG_PASSWORD_MESSAGE);
        }
        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, SAME_PASSWORD_MESSAGE);
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userAccountRepository.saveAndFlush(user);

        redisService.delete(attemptsKey);

        if (request.shouldLogoutAllDevices()) {
            // Signs out every device, including this one: the frontend should go to the login page.
            refreshSessionRepository.revokeAllActiveByUserId(userId, Instant.now());
        }

        try {
            emailService.sendPasswordChangedNotice(user.getEmail(), user.getFullName());
        } catch (RuntimeException exception) {
            LOGGER.warn("Could not send password-changed notice to user {}", userId, exception);
        }
    }
}