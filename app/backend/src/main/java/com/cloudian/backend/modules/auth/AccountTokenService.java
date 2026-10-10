package com.cloudian.backend.modules.auth;

import java.time.Duration;
import java.time.Instant;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cloudian.backend.commons.enums.AccountTokenPurpose;
import com.cloudian.backend.exceptions.ApiException;
import com.cloudian.backend.models.AccountToken;
import com.cloudian.backend.models.UserAccount;
import com.cloudian.backend.repositories.AccountTokenRepository;
import com.cloudian.backend.utils.TokenHashUtil;

/**
 * Issues and consumes one-time account tokens (email verification, password reset, email change).
 */
@Service
public class AccountTokenService {

    private static final String INVALID_TOKEN_MESSAGE = "The token is invalid or expired.";

    private final AccountTokenRepository accountTokenRepository;

    public AccountTokenService(AccountTokenRepository accountTokenRepository) {
        this.accountTokenRepository = accountTokenRepository;
    }

    /**
     * Stores only the hash of a new token and returns the raw token, which must be sent to the user
     * and never persisted or logged.
     */
    @Transactional
    public String issue(UserAccount user, AccountTokenPurpose purpose, Duration timeToLive) {
        String rawToken = TokenHashUtil.generateToken();

        AccountToken token = new AccountToken();
        token.setUser(user);
        token.setPurpose(purpose);
        token.setTokenHash(TokenHashUtil.sha256Hex(rawToken));
        token.setExpiresAt(Instant.now().plus(timeToLive));
        accountTokenRepository.save(token);

        return rawToken;
    }

    /**
     * Marks a valid token as used and returns it. Throws 400 if the token is unknown,
     * belongs to another purpose, was already used, or has expired.
     */
    @Transactional
    public AccountToken consume(String rawToken, AccountTokenPurpose purpose) {
        AccountToken token = accountTokenRepository
                .findByTokenHashAndPurpose(TokenHashUtil.sha256Hex(rawToken), purpose)
                .orElseThrow(AccountTokenService::invalidToken);

        Instant now = Instant.now();
        if (token.getConsumedAt() != null || !token.getExpiresAt().isAfter(now)) {
            throw invalidToken();
        }
        token.setConsumedAt(now);
        return token;
    }

    private static ApiException invalidToken() {
        return new ApiException(HttpStatus.BAD_REQUEST, INVALID_TOKEN_MESSAGE);
    }
}
