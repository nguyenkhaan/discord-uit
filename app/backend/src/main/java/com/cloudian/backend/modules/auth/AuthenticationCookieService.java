package com.cloudian.backend.modules.auth;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import com.cloudian.backend.commons.enums.TokenType;
import com.cloudian.backend.modules.auth.dto.LoginResponse;
import com.cloudian.backend.utils.JwtUtil;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Service
public class AuthenticationCookieService {

    public static final String ACCESS_TOKEN_COOKIE_NAME = "access_token";
    public static final String REFRESH_TOKEN_COOKIE_NAME = "refresh_token";

    private final JwtUtil jwtUtil;
    private final boolean secure;
    private final String sameSite;
    private final String cookiePath;

    public AuthenticationCookieService(
            JwtUtil jwtUtil,
            @Value("${app.auth.cookie.secure:false}") boolean secure,
            @Value("${app.auth.cookie.same-site:Strict}") String sameSite,
            @Value("${app.auth.cookie.path:/api}") String cookiePath) {
        this.jwtUtil = jwtUtil;
        this.secure = secure;
        this.sameSite = sameSite;
        this.cookiePath = cookiePath;
    }

    public void writeAuthenticationCookies(
            HttpServletResponse response,
            LoginResponse tokens) {
        writeCookie(
                response,
                ACCESS_TOKEN_COOKIE_NAME,
                tokens.getAccessToken(),
                TokenType.ACCESS,
                cookiePath);
        writeCookie(
                response,
                REFRESH_TOKEN_COOKIE_NAME,
                tokens.getRefreshToken(),
                TokenType.REFRESH,
                cookiePath + "/auth");
    }

    public Optional<String> accessToken(HttpServletRequest request) {
        return cookieValue(request, ACCESS_TOKEN_COOKIE_NAME);
    }

    public Optional<String> refreshToken(HttpServletRequest request) {
        return cookieValue(request, REFRESH_TOKEN_COOKIE_NAME);
    }

    public void clearAuthenticationCookies(HttpServletResponse response) {
        clearCookie(response, ACCESS_TOKEN_COOKIE_NAME, cookiePath);
        clearCookie(response, REFRESH_TOKEN_COOKIE_NAME, cookiePath + "/auth");
    }

    private void writeCookie(
            HttpServletResponse response,
            String name,
            String token,
            TokenType tokenType,
            String path) {
        Instant expiresAt = jwtUtil.extractExpiration(token, tokenType).toInstant();
        Duration maxAge = Duration.between(Instant.now(), expiresAt);

        addCookie(response, name, token, path, maxAge.isNegative() ? Duration.ZERO : maxAge);
    }

    private void clearCookie(HttpServletResponse response, String name, String path) {
        addCookie(response, name, "", path, Duration.ZERO);
    }

    private void addCookie(
            HttpServletResponse response,
            String name,
            String value,
            String path,
            Duration maxAge) {
        ResponseCookie cookie = ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(secure)
                .sameSite(sameSite)
                .path(path)
                .maxAge(maxAge)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private Optional<String> cookieValue(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();

        if (cookies == null) {
            return Optional.empty();
        }

        for (Cookie cookie : cookies) {
            if (name.equals(cookie.getName()) && cookie.getValue() != null && !cookie.getValue().isBlank()) {
                return Optional.of(cookie.getValue());
            }
        }

        return Optional.empty();
    }
}
