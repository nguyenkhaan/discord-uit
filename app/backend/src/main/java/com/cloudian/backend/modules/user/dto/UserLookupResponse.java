package com.cloudian.backend.modules.user.dto;

import java.util.UUID;

import com.cloudian.backend.models.UserAccount;

/** Minimal public profile returned when looking a user up by exact email (e.g. to send a direct invite). */
public record UserLookupResponse(
        UUID userId,
        String fullName,
        String email
) {

    public static UserLookupResponse from(UserAccount user) {
        return new UserLookupResponse(user.getId(), user.getFullName(), user.getEmail());
    }
}
