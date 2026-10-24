package com.cloudian.backend.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.cloudian.backend.commons.enums.SystemRole;
import com.cloudian.backend.models.UserAccount;

class CustomUserDetailsTests {

    @Test
    void exposesUserIdAsUuid() {
        UUID userId = UUID.randomUUID();
        UserAccount user = new UserAccount();
        user.setId(userId);
        user.setSystemRole(SystemRole.USER);

        CustomUserDetails userDetails = new CustomUserDetails(user);

        assertThat(userDetails.getUserId()).isEqualTo(userId);
    }
}
