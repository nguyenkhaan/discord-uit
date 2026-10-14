package com.cloudian.backend.modules.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Date;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import com.cloudian.backend.commons.enums.TokenType;
import com.cloudian.backend.modules.auth.dto.LoginResponse;
import com.cloudian.backend.utils.JwtUtil;

import jakarta.servlet.http.Cookie;

class AuthenticationCookieServiceTests {

    @Test
    void writesHttpOnlyAuthenticationCookiesWithScopedPaths() {
        JwtUtil jwtUtil = mock(JwtUtil.class);
        Instant expiresAt = Instant.now().plusSeconds(60);
        when(jwtUtil.extractExpiration("access-token", TokenType.ACCESS)).thenReturn(Date.from(expiresAt));
        when(jwtUtil.extractExpiration("refresh-token", TokenType.REFRESH)).thenReturn(Date.from(expiresAt));
        AuthenticationCookieService cookieService = new AuthenticationCookieService(
                jwtUtil,
                true,
                "Strict",
                "/api");
        MockHttpServletResponse response = new MockHttpServletResponse();

        cookieService.writeAuthenticationCookies(
                response,
                new LoginResponse("access-token", "refresh-token"));

        assertThat(response.getHeaders(HttpHeaders.SET_COOKIE))
                .anySatisfy(cookie -> assertThat(cookie)
                        .contains("access_token=access-token")
                        .contains("Path=/api")
                        .contains("HttpOnly")
                        .contains("Secure")
                        .contains("SameSite=Strict"))
                .anySatisfy(cookie -> assertThat(cookie)
                        .contains("refresh_token=refresh-token")
                        .contains("Path=/api/auth")
                        .contains("HttpOnly")
                        .contains("Secure")
                        .contains("SameSite=Strict"));
    }

    @Test
    void readsAccessAndRefreshTokensFromRequestCookies() {
        AuthenticationCookieService cookieService = new AuthenticationCookieService(
                mock(JwtUtil.class),
                true,
                "Strict",
                "/api");
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(
                new Cookie(AuthenticationCookieService.ACCESS_TOKEN_COOKIE_NAME, "access-token"),
                new Cookie(AuthenticationCookieService.REFRESH_TOKEN_COOKIE_NAME, "refresh-token"));

        assertThat(cookieService.accessToken(request)).contains("access-token");
        assertThat(cookieService.refreshToken(request)).contains("refresh-token");
    }
}
