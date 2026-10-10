package com.cloudian.backend.modules.user.dto;

import java.time.Instant;
import java.util.UUID;

import com.cloudian.backend.commons.enums.AccountStatus;
import com.cloudian.backend.commons.enums.AccountType;
import com.cloudian.backend.commons.enums.SystemRole;
import com.cloudian.backend.models.UserAccount;

/** Never expose password_hash or uit_subject here. */
public record MeResponse(
        UUID id,
        String email,
        String fullName,
        AccountType accountType,
        AccountStatus accountStatus,
        SystemRole systemRole,
        Instant emailVerifiedAt,
        Instant createdAt,
        Instant updatedAt
) {

    public static MeResponse from(UserAccount user) {
        return new MeResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getAccountType(),
                user.getAccountStatus(),
                user.getSystemRole(),
                user.getEmailVerifiedAt(),
                user.getCreatedAt(),
                user.getUpdatedAt());
    }
}
