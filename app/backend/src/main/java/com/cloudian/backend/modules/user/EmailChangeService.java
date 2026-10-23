package com.cloudian.backend.modules.user;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
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
import com.cloudian.backend.modules.user.dto.EmailChangeRequest;
import com.cloudian.backend.repositories.UserAccountRepository;
import com.cloudian.backend.services.EmailService;
import com.cloudian.backend.services.RedisService;
import com.cloudian.backend.utils.EmailUtil;
import com.cloudian.backend.utils.TokenHashUtil;

/**
 * Two-step email change for PERSONAL accounts:
 *   1. request(): user re-enters the current password; a one-time link is sent to the NEW address.
 *   2. confirm(): the link's token proves ownership of the new address; the email is updated
 *      and a notice is sent to the OLD address.
 */
@Service
public class EmailChangeService {

    private static final Logger LOGGER = LoggerFactory.getLogger(EmailChangeService.class);

    private static final String INVALID_TOKEN_MESSAGE = "The token is invalid or expired.";
    private static final String WRONG_PASSWORD_MESSAGE = "The current password is incorrect.";
    private static final String UIT_ACCOUNT_MESSAGE = "UIT accounts cannot change their email.";
    private static final String UIT_EMAIL_MESSAGE = "A UIT email address cannot be used for a personal account.";
    private static final String SAME_EMAIL_MESSAGE = "The new email is the same as the current one.";
    private static final String EMAIL_TAKEN_MESSAGE = "This email is already registered.";
    private static final String COOLDOWN_MESSAGE = "Please wait before requesting another email change.";

    private static final String VALUE_SEPARATOR = ":";   // UUID has no ':' so "userId:email" splits safely


    private final UserAccountRepository userAccountRepository;
    private final RedisService redisService;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final Duration tokenTtl;
    private final Duration cooldown;
    private final String confirmUrl;

    public EmailChangeService(
            UserAccountRepository userAccountRepository,
            RedisService redisService,
            EmailService emailService,
            PasswordEncoder passwordEncoder,
            @Value("${app.email-change.ttl:PT30M}") Duration tokenTtl,
            @Value("${app.email-change.cooldown:PT1M}") Duration cooldown,
            @Value("${app.email-change.confirm-url:http://localhost:5173/confirm-email-change}") String confirmUrl
    ) {
        this.userAccountRepository = userAccountRepository;
        this.redisService = redisService;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
        this.tokenTtl = tokenTtl;
        this.cooldown = cooldown;
        this.confirmUrl = confirmUrl;
    }


    // used this function when an email-change request is called
    @Transactional(readOnly = true)
    public void request(UUID userId, EmailChangeRequest request) {
        UserAccount user = userAccountRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Authentication is required."));

        // UIT accounts sign in with SSO and have no password.
        if (user.getAccountType() != AccountType.PERSONAL || user.getPasswordHash() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, UIT_ACCOUNT_MESSAGE);
        }
        // 400, not 401: a wrong password must not make the frontend think the access token expired.
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, WRONG_PASSWORD_MESSAGE);
        }

        String newEmail = EmailUtil.normalize(request.newEmail());
        validateNewEmail(user, newEmail);

        String userIdText = userId.toString();
        String cooldownKey = RedisKey.emailChangeCooldown(userIdText);

        if (!redisService.setIfAbsent(cooldownKey, "1", cooldown)) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, COOLDOWN_MESSAGE);
        }

        String rawToken = TokenHashUtil.generateToken();
        String tokenHash = TokenHashUtil.sha256Hex(rawToken);

        try {
            redisService.set(RedisKey.emailChange(tokenHash), userIdText + VALUE_SEPARATOR + newEmail, tokenTtl);
            redisService.set(RedisKey.emailChangePending(userIdText), tokenHash, tokenTtl);
            emailService.sendEmailChangeConfirmation(newEmail, user.getFullName(), buildConfirmLink(rawToken));
        } catch (RuntimeException exception) {
            redisService.delete(cooldownKey);
            throw exception;   // the user is signed in, so reporting the failure reveals nothing
        }
    }



    // use this function when confirm email change is needed
    @Transactional
    public void confirm(String rawToken) {
        String tokenHash = TokenHashUtil.sha256Hex(rawToken);
        String storedValue = redisService.getAndDelete(RedisKey.emailChange(tokenHash))
                .orElseThrow(EmailChangeService::invalidToken);

        String[] parts = storedValue.split(VALUE_SEPARATOR, 2);
        if (parts.length != 2) {
            throw invalidToken();
        }
        String userIdText = parts[0];
        String newEmail = parts[1];

        // Reject an older link if the user has since requested another change.
        String latestHash = redisService.get(RedisKey.emailChangePending(userIdText))
                .orElseThrow(EmailChangeService::invalidToken);
        if (!latestHash.equals(tokenHash)) {
            throw invalidToken();
        }

        UserAccount user = userAccountRepository.findById(UUID.fromString(userIdText))
                .orElseThrow(EmailChangeService::invalidToken);
        if (user.getAccountType() != AccountType.PERSONAL || user.getAccountStatus() == AccountStatus.BANNED) {
            throw invalidToken();
        }

        // Someone may have registered this address between step 1 and step 2.
        validateNewEmail(user, newEmail);

        String oldEmail = user.getEmail();
        user.setEmail(newEmail);
        user.setEmailVerifiedAt(Instant.now());   // clicking the link proves ownership

        try {
            userAccountRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException exception) {
            throw new ApiException(HttpStatus.CONFLICT, EMAIL_TAKEN_MESSAGE);
        }

        redisService.delete(RedisKey.emailChangePending(userIdText));

        // Best effort: the change is already saved, a mail failure must not undo it.
        try {
            emailService.sendEmailChangedNotice(oldEmail, user.getFullName(), newEmail);
        } catch (RuntimeException exception) {
            LOGGER.warn("Could not send email-changed notice to the old address of user {}", userIdText, exception);
        }
    }

    // ==================== helpers ====================

    private void validateNewEmail(UserAccount user, String newEmail) {
        if (newEmail.equals(user.getEmail())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, SAME_EMAIL_MESSAGE);
        }
        if (EmailUtil.isUitEmail(newEmail)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, UIT_EMAIL_MESSAGE);
        }
        if (userAccountRepository.existsByEmail(newEmail)) {
            throw new ApiException(HttpStatus.CONFLICT, EMAIL_TAKEN_MESSAGE);
        }
    }


    private String buildConfirmLink(String rawToken) {
        return UriComponentsBuilder.fromUriString(confirmUrl)
                .queryParam("token", rawToken)
                .build()
                .encode()
                .toUriString();
    }

    private static ApiException invalidToken() {
        return new ApiException(HttpStatus.BAD_REQUEST, INVALID_TOKEN_MESSAGE);
    }
}