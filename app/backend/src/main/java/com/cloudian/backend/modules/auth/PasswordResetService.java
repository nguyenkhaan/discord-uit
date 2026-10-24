package com.cloudian.backend.modules.auth;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriComponentsBuilder;

import com.cloudian.backend.commons.constants.RedisKey;
import com.cloudian.backend.commons.enums.AccountStatus;
import com.cloudian.backend.commons.enums.AccountType;
import com.cloudian.backend.exceptions.ApiException;
import com.cloudian.backend.models.UserAccount;
import com.cloudian.backend.modules.auth.dto.ForgotPasswordRequest;
import com.cloudian.backend.modules.auth.dto.ResetPasswordRequest;
import com.cloudian.backend.repositories.RefreshSessionRepository;
import com.cloudian.backend.repositories.UserAccountRepository;
import com.cloudian.backend.services.EmailService;
import com.cloudian.backend.services.RedisService;
import com.cloudian.backend.utils.EmailUtil;
import com.cloudian.backend.utils.TokenHashUtil;


/*
Flow for reset password when click forgot password on Login Page
 *   1. requestReset(): send a one-time link to the account's email.
 *   2. resetPassword(): the link's token proves email ownership; set the new password
 *      and sign the user out of every device.
 */

@Service
public class PasswordResetService {

    private static final Logger LOGGER = LoggerFactory.getLogger(PasswordResetService.class);

    private static final String INVALID_TOKEN_MESSAGE = "The token is invalid or expired.";
    private static final String SAME_PASSWORD_MESSAGE = "The new password must be different from the current one.";

    private final UserAccountRepository userAccountRepository;
    private final RefreshSessionRepository refreshSessionRepository;
    private final RedisService redisService;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final Duration tokenTtl;
    private final Duration cooldown;
    private final String resetUrl;

    public PasswordResetService(
            UserAccountRepository userAccountRepository,
            RefreshSessionRepository refreshSessionRepository,
            RedisService redisService,
            EmailService emailService,
            PasswordEncoder passwordEncoder,
            @Value("${app.password-reset.ttl:PT30M}") Duration tokenTtl,
            @Value("${app.password-reset.cooldown:PT1M}") Duration cooldown,
            @Value("${app.password-reset.reset-url:http://localhost:5173/reset-password}") String resetUrl
    ) {
        this.userAccountRepository = userAccountRepository;
        this.refreshSessionRepository = refreshSessionRepository;
        this.redisService = redisService;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
        this.tokenTtl = tokenTtl;
        this.cooldown = cooldown;
        this.resetUrl = resetUrl;
    }

    @Transactional(readOnly = true)
    public void requestReset(ForgotPasswordRequest request) {
        String email = EmailUtil.normalize(request.email());
        Optional<UserAccount> found = userAccountRepository.findByEmail(email);
        if (found.isEmpty()) {
            return;
        }

        UserAccount user = found.get();
        // UIT accounts sign in with SSO and have no password;
        // Only Active user can reset their password
        if (user.getAccountType() != AccountType.PERSONAL
                || user.getPasswordHash() == null
                || user.getAccountStatus() != AccountStatus.ACTIVE) {
            return;
        }

        // avoid spamming forgot password
        String userIdText = user.getId().toString();
        String cooldownKey = RedisKey.passwordResetCooldown(userIdText);

        // change
        // instead of getting then setting not we do it at the same time so that only 1 request win it
        if (!redisService.setIfAbsent(cooldownKey, "1", cooldown)) {
            return;   // silent: a 429 here would reveal that the email exists
        }

        String rawToken = TokenHashUtil.generateToken();
        String tokenHash = TokenHashUtil.sha256Hex(rawToken);

        try {
            redisService.set(RedisKey.passwordReset(tokenHash), userIdText, tokenTtl);
            redisService.set(RedisKey.passwordResetPending(userIdText), tokenHash, tokenTtl);
            emailService.sendPasswordResetEmail(user.getEmail(), user.getFullName(), buildResetLink(rawToken));
        } catch (RuntimeException exception) {
            // Nothing was sent: free the slot so the user can retry right away.
            redisService.delete(cooldownKey);
            // Do not rethrow: an error here (vs 202 for unknown emails) would reveal that the account exists.
            LOGGER.warn("Could not send password-reset email to user {}", userIdText, exception);
        }
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String tokenHash = TokenHashUtil.sha256Hex(request.token());

        // get, not getAndDelete: if validation below fails, the user can fix the input and retry the same link.
        String userIdText = redisService.get(RedisKey.passwordReset(tokenHash))
                .orElseThrow(PasswordResetService::invalidToken);

        String latestHash = redisService.get(RedisKey.passwordResetPending(userIdText))
                .orElseThrow(PasswordResetService::invalidToken);
        if (!latestHash.equals(tokenHash)) {
            throw invalidToken();
        }

        UserAccount user = userAccountRepository.findById(UUID.fromString(userIdText))
                .orElseThrow(PasswordResetService::invalidToken);
        if (user.getAccountType() != AccountType.PERSONAL
                || user.getPasswordHash() == null
                || user.getAccountStatus() != AccountStatus.ACTIVE) {
            throw invalidToken();
        }

        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, SAME_PASSWORD_MESSAGE);
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userAccountRepository.saveAndFlush(user);

        // Sign out every device. JwtRequestFilter checks the "sid" claim against refresh_session,
        // so access tokens of these sessions stop working immediately too.
        refreshSessionRepository.revokeAllActiveByUserId(user.getId(), Instant.now());

        // The link is single-use.
        redisService.delete(RedisKey.passwordReset(tokenHash));
        redisService.delete(RedisKey.passwordResetPending(userIdText));
        redisService.delete(RedisKey.passwordChangeAttempts(userIdText));

        try {
            emailService.sendPasswordChangedNotice(user.getEmail(), user.getFullName());
        } catch (RuntimeException exception) {
            LOGGER.warn("Could not send password-changed notice to user {}", userIdText, exception);
        }
    }

    private String buildResetLink(String rawToken) {
        return UriComponentsBuilder.fromUriString(resetUrl)
                .queryParam("token", rawToken)
                .build()
                .encode()
                .toUriString();
    }

    private static ApiException invalidToken() {
        return new ApiException(HttpStatus.BAD_REQUEST, INVALID_TOKEN_MESSAGE);
    }
}
