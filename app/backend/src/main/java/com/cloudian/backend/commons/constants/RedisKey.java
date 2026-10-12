package com.cloudian.backend.commons.constants;

import java.util.Objects;

public final class RedisKey {

    private static final String EMAIL_VERIFICATION_PREFIX = "auth:email-verification:";
    private static final String REVOKED_ACCESS_TOKEN_PREFIX = "auth:revoked-access-token:";
    private static final String EMAIL_CHANGE_PREFIX = "auth:email-change:";
    private static final String EMAIL_CHANGE_PENDING_PREFIX = "auth:email-change-pending:";
    private static final String EMAIL_CHANGE_COOLDOWN_PREFIX = "auth:email-change-cooldown:";

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
}
