package com.cloudian.backend.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

import com.cloudian.backend.commons.enums.SystemRole;
import com.cloudian.backend.models.UserAccount;

@SpringJUnitConfig(classes = { MethodSecurityConfig.class, RoleAuthorizationTests.AdminActions.class })
class RoleAuthorizationTests {

    private final AdminActions adminActions;

    @Autowired
    RoleAuthorizationTests(AdminActions adminActions) {
        this.adminActions = adminActions;
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void allowsAdminRoleToCallAdminMethod() {
        authenticateAs(SystemRole.ADMIN);

        assertThat(adminActions.getMessage()).isEqualTo("admin access granted");
    }

    @Test
    void deniesUserRoleFromCallingAdminMethod() {
        authenticateAs(SystemRole.USER);

        assertThatThrownBy(adminActions::getMessage)
                .isInstanceOf(AccessDeniedException.class);
    }

    private static void authenticateAs(SystemRole role) {
        UserAccount user = new UserAccount();
        user.setId(UUID.randomUUID());
        user.setSystemRole(role);

        CustomUserDetails principal = new CustomUserDetails(user);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
    }

    @Service
    static class AdminActions {

        @PreAuthorize("hasRole('ADMIN')")
        String getMessage() {
            return "admin access granted";
        }
    }
}
