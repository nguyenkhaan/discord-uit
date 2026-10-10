package com.cloudian.backend.modules.auth.dto;

import java.util.UUID;

import com.cloudian.backend.commons.enums.AccountStatus;
import com.cloudian.backend.models.UserAccount;

public record RegisterResponse(UUID id, String email, String fullName, AccountStatus accountStatus) {

    public static RegisterResponse from(UserAccount user) {
        return new RegisterResponse(user.getId(), user.getEmail(), user.getFullName(), user.getAccountStatus());
    }
}
