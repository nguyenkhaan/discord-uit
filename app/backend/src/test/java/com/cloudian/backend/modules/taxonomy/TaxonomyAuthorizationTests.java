package com.cloudian.backend.modules.taxonomy;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;

import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

import com.cloudian.backend.commons.enums.SystemRole;
import com.cloudian.backend.models.UserAccount;
import com.cloudian.backend.modules.taxonomy.dto.CollectionRequest;
import com.cloudian.backend.modules.taxonomy.dto.TagRequest;
import com.cloudian.backend.security.CustomUserDetails;
import com.cloudian.backend.security.MethodSecurityConfig;

@SpringJUnitConfig(classes = {
        MethodSecurityConfig.class,
        TaxonomyAuthorizationTests.TestConfig.class
})
class TaxonomyAuthorizationTests {

    @Autowired
    private AdminTaxonomyController controller;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void deniesRegularUserFromCreatingCollection() {
        authenticateAs(SystemRole.USER);

        assertThatThrownBy(() -> controller.createCollection(
                new CollectionRequest("Data", "Description", "data", java.util.List.of())))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void deniesRegularUserFromDeletingTag() {
        authenticateAs(SystemRole.USER);

        assertThatThrownBy(() -> controller.deleteTag(UUID.randomUUID()))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void allowsAdminToCreateTag() {
        authenticateAs(SystemRole.ADMIN);

        controller.createTag(new TagRequest("Programming", "programming", "Software code"));
    }

    private static void authenticateAs(SystemRole role) {
        UserAccount user = new UserAccount();
        user.setId(UUID.randomUUID());
        user.setSystemRole(role);
        CustomUserDetails principal = new CustomUserDetails(user);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
    }

    @org.springframework.boot.test.context.TestConfiguration(proxyBeanMethods = false)
    static class TestConfig {

        @org.springframework.context.annotation.Bean
        TaxonomyService taxonomyService() {
            return mock(TaxonomyService.class);
        }

        @org.springframework.context.annotation.Bean
        AdminTaxonomyController adminTaxonomyController(TaxonomyService taxonomyService) {
            return new AdminTaxonomyController(taxonomyService);
        }
    }
}
