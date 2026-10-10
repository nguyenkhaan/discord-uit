package com.cloudian.backend.commons.constants;

import java.util.Objects;

public final class RedisKey {

    private static final String EMAIL_VERIFICATION_PREFIX = "auth:email-verification:";
    private static final String REVOKED_ACCESS_TOKEN_PREFIX = "auth:revoked-access-token:";

    private RedisKey() {
    }

    public static String emailVerification(String tokenHash) {
        return EMAIL_VERIFICATION_PREFIX + Objects.requireNonNull(tokenHash, "tokenHash must not be null");
    }

    public static String revokedAccessToken(String tokenId) {
        return REVOKED_ACCESS_TOKEN_PREFIX + Objects.requireNonNull(tokenId, "tokenId must not be null");
    }
}
