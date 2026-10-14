package com.cloudian.backend.modules.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.UUID;

import com.cloudian.backend.modules.user.EmailChangeService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import com.cloudian.backend.commons.enums.AccountStatus;
import com.cloudian.backend.commons.enums.SystemRole;
import com.cloudian.backend.models.UserAccount;
import com.cloudian.backend.modules.auth.dto.LogoutRequest;
import com.cloudian.backend.modules.auth.dto.LoginRequest;
import com.cloudian.backend.modules.auth.dto.LoginResponse;
import com.cloudian.backend.security.CustomUserDetails;

class AuthControllerTests {

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void logoutUsesTheAuthenticatedUsersCurrentTokensAndClearsTheSecurityContext() {
        UUID userId = UUID.randomUUID();
        CurrentSessionLogoutService logoutService = mock(CurrentSessionLogoutService.class);
        AuthController controller = new AuthController(mock(AuthService.class), logoutService, mock(EmailChangeService.class),
                mock(PasswordResetService.class), mock(AuthenticationCookieService.class));
        MockHttpServletRequest servletRequest = new MockHttpServletRequest();
        servletRequest.addHeader("Authorization", "Bearer access-token");
        MockHttpServletResponse servletResponse = new MockHttpServletResponse();
        SecurityContextHolder.getContext().setAuthentication(authentication(userId));

        ResponseEntity<Void> response = controller.logout(
                new LogoutRequest("refresh-token"),
                servletRequest,
                servletResponse);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(logoutService).logout(userId, "access-token", "refresh-token");
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void loginWritesAuthenticationCookies() {
        AuthService authService = mock(AuthService.class);
        AuthenticationCookieService cookieService = mock(AuthenticationCookieService.class);
        AuthController controller = new AuthController(
                authService,
                mock(CurrentSessionLogoutService.class),
                mock(EmailChangeService.class),
                mock(PasswordResetService.class),
                cookieService);
        LoginRequest request = new LoginRequest();
        request.setUsername("person@example.com");
        request.setPassword("password");
        LoginResponse tokens = new LoginResponse("access-token", "refresh-token");
        MockHttpServletResponse servletResponse = new MockHttpServletResponse();
        when(authService.login(request)).thenReturn(tokens);

        ResponseEntity<LoginResponse> response = controller.login(request, servletResponse);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(tokens);
        verify(cookieService).writeAuthenticationCookies(servletResponse, tokens);
    }

    private UsernamePasswordAuthenticationToken authentication(UUID userId) {
        UserAccount user = new UserAccount();
        user.setId(userId);
        user.setEmail("person@example.com");
        user.setPasswordHash("password-hash");
        user.setAccountStatus(AccountStatus.ACTIVE);
        user.setSystemRole(SystemRole.USER);
        CustomUserDetails userDetails = new CustomUserDetails(user);
        return new UsernamePasswordAuthenticationToken(
                userDetails,
                null,
                userDetails.getAuthorities());
    }
}
