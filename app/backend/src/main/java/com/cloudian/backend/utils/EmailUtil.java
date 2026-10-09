package com.cloudian.backend.utils;

import java.util.Locale;

public final class EmailUtil {

    private static final String UIT_DOMAIN = "uit.edu.vn";

    private EmailUtil() {
    }

    /**
     * Trims surrounding whitespace and lower-cases the address so that
     * "  Truong@Gmail.COM " and "truong@gmail.com" are treated as the same account.
     */
    public static String normalize(String email) {
        if (email == null) {
            return null;
        }
        return email.strip().toLowerCase(Locale.ROOT);
    }

    /**
     * True for uit.edu.vn and any of its subdomains (e.g. gm.uit.edu.vn).
     * Expects an already-normalized address.
     */
    public static boolean isUitEmail(String normalizedEmail) {
        if (normalizedEmail == null) {
            return false;
        }
        int atIndex = normalizedEmail.lastIndexOf('@');
        if (atIndex < 0) {
            return false;
        }
        String domain = normalizedEmail.substring(atIndex + 1);
        return domain.equals(UIT_DOMAIN) || domain.endsWith("." + UIT_DOMAIN);
    }
}
