package com.cloudian.backend.modules.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import com.cloudian.backend.commons.enums.AccountStatus;
import com.cloudian.backend.exceptions.ApiException;
import com.cloudian.backend.models.UserAccount;
import com.cloudian.backend.repositories.UserAccountRepository;

class UserLookupServiceTests {

    private UserAccountRepository userAccountRepository;
    private UserService userService;

    @BeforeEach
    void setUp() {
        userAccountRepository = mock(UserAccountRepository.class);
        userService = new UserService(userAccountRepository);
    }

    @Test
    void findsActiveUserByNormalizedEmail() {
        UserAccount user = user(AccountStatus.ACTIVE);
        when(userAccountRepository.findByEmail("bob@gmail.com")).thenReturn(Optional.of(user));

        var response = userService.lookupByEmail("  Bob@Gmail.COM ");

        assertThat(response.userId()).isEqualTo(user.getId());
        assertThat(response.fullName()).isEqualTo("Bob");
        assertThat(response.email()).isEqualTo("bob@gmail.com");
    }

    @Test
    void reportsUnverifiedAccountAsNotFound() {
        when(userAccountRepository.findByEmail("bob@gmail.com"))
                .thenReturn(Optional.of(user(AccountStatus.UNVERIFIED)));

        assertThatThrownBy(() -> userService.lookupByEmail("bob@gmail.com"))
                .isInstanceOfSatisfying(ApiException.class, exception ->
                        assertThat(exception.getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    void reportsUnknownEmailAsNotFound() {
        when(userAccountRepository.findByEmail("nobody@gmail.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.lookupByEmail("nobody@gmail.com"))
                .isInstanceOfSatisfying(ApiException.class, exception ->
                        assertThat(exception.getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    void rejectsBlankEmailWithoutQuerying() {
        assertThatThrownBy(() -> userService.lookupByEmail("   "))
                .isInstanceOfSatisfying(ApiException.class, exception ->
                        assertThat(exception.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));

        verify(userAccountRepository, never()).findByEmail(anyString());
    }

    private static UserAccount user(AccountStatus status) {
        UserAccount user = new UserAccount();
        user.setId(UUID.randomUUID());
        user.setEmail("bob@gmail.com");
        user.setFullName("Bob");
        user.setAccountStatus(status);
        return user;
    }
}
