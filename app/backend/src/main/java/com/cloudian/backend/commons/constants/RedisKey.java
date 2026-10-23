package com.cloudian.backend.commons.constants;

import java.util.Objects;

public final class RedisKey {

    private static final String EMAIL_VERIFICATION_PREFIX = "auth:email-verification:";
    private static final String REVOKED_ACCESS_TOKEN_PREFIX = "auth:revoked-access-token:";
    private static final String EMAIL_CHANGE_PREFIX = "auth:email-change:";
    private static final String EMAIL_CHANGE_PENDING_PREFIX = "auth:email-change-pending:";
    private static final String EMAIL_CHANGE_COOLDOWN_PREFIX = "auth:email-change-cooldown:";
    private static final String PASSWORD_RESET_PREFIX = "auth:password-reset:";
    private static final String PASSWORD_RESET_PENDING_PREFIX = "auth:password-reset-pending:";
    private static final String PASSWORD_RESET_COOLDOWN_PREFIX = "auth:password-reset-cooldown:";
    private static final String PASSWORD_CHANGE_ATTEMPTS_PREFIX = "auth:password-change-attempts:";
    private static final String RATE_LIMIT_PREFIX = "rate-limit:";

    private RedisKey() {
    }

    public static String emailVerification(String tokenHash) {
        return EMAIL_VERIFICATION_PREFIX + Objects.requireNonNull(tokenHash, "tokenHash must not be null");
    }

    public static String revokedAccessToken(String tokenId) {
        return REVOKED_ACCESS_TOKEN_PREFIX + Objects.requireNonNull(tokenId, "tokenId must not be null");
    }

    /** token hash → "userId:newEmail" */
    public static String emailChange(String tokenHash) {
        return EMAIL_CHANGE_PREFIX + Objects.requireNonNull(tokenHash, "tokenHash must not be null");
    }

    // use this so that email can only be changed through the newest link
    public static String emailChangePending(String userId) {
        return EMAIL_CHANGE_PENDING_PREFIX + Objects.requireNonNull(userId, "userId must not be null");
    }

    // avoid spamming email changing
    public static String emailChangeCooldown(String userId) {
        return EMAIL_CHANGE_COOLDOWN_PREFIX + Objects.requireNonNull(userId, "userId must not be null");
    }

    /** token hash → userId */
    public static String passwordReset(String tokenHash) {
        return PASSWORD_RESET_PREFIX + Objects.requireNonNull(tokenHash, "tokenHash must not be null");
    }

    // userId → token hash of the newest reset link (older links become invalid)
    public static String passwordResetPending(String userId) {
        return PASSWORD_RESET_PENDING_PREFIX + Objects.requireNonNull(userId, "userId must not be null");
    }

    // avoid spamming "forgot password" emails
    public static String passwordResetCooldown(String userId) {
        return PASSWORD_RESET_COOLDOWN_PREFIX + Objects.requireNonNull(userId, "userId must not be null");
    }

    // count wrong currentPassword attempts when changing password in Settings
    public static String passwordChangeAttempts(String userId) {
        return PASSWORD_CHANGE_ATTEMPTS_PREFIX + Objects.requireNonNull(userId, "userId must not be null");
    }

    // rule name + client IP → number of requests in the current window
    public static String rateLimit(String rule, String clientIp) {
        return RATE_LIMIT_PREFIX
                + Objects.requireNonNull(rule, "rule must not be null") + ":"
                + Objects.requireNonNull(clientIp, "clientIp must not be null");
    }
}
