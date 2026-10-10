package com.cloudian.backend.commons.constants;

import java.util.Objects;

public final class RedisKey {

    private static final String EMAIL_VERIFICATION_PREFIX = "auth:email-verification:";

    private RedisKey() {
    }

    public static String emailVerification(String tokenHash) {
        return EMAIL_VERIFICATION_PREFIX + Objects.requireNonNull(tokenHash, "tokenHash must not be null");
    }
}
