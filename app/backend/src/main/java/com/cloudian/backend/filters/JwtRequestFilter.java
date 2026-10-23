package com.cloudian.backend.filters;

import java.io.IOException;
import java.util.UUID;
import java.time.Instant;

import com.cloudian.backend.commons.enums.AccountStatus;
import com.cloudian.backend.repositories.RefreshSessionRepository;
import com.cloudian.backend.commons.enums.TokenType;
import com.cloudian.backend.exceptions.ErrorResponseWriter;
import com.cloudian.backend.modules.auth.AuthenticationCookieService;
import com.cloudian.backend.security.CustomUserDetails;
import com.cloudian.backend.services.AccessTokenRevocationService;
import com.cloudian.backend.services.CustomUserDetailsService;
import com.cloudian.backend.utils.JwtUtil;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtRequestFilter extends OncePerRequestFilter {

    private static final String INVALID_ACCESS_TOKEN_MESSAGE = "The access token is invalid or expired.";
    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService customUserDetailsService;
    private final ErrorResponseWriter errorResponseWriter = new ErrorResponseWriter();
    private final AccessTokenRevocationService accessTokenRevocationService;
    private final RefreshSessionRepository refreshSessionRepository;
    private final AuthenticationCookieService authenticationCookieService;

    public JwtRequestFilter(
            JwtUtil jwtUtil,
            CustomUserDetailsService customUserDetailsService,
            AccessTokenRevocationService accessTokenRevocationService,
            RefreshSessionRepository refreshSessionRepository,
            AuthenticationCookieService authenticationCookieService) {
        this.jwtUtil = jwtUtil;
        this.customUserDetailsService = customUserDetailsService;
        this.accessTokenRevocationService = accessTokenRevocationService;
        this.refreshSessionRepository = refreshSessionRepository;
        this.authenticationCookieService = authenticationCookieService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain) throws ServletException, IOException {
        String accessToken = accessToken(request);
        if (accessToken == null) {
            chain.doFilter(request, response);
            return;
        }

        try {
            if (!authenticate(accessToken, request)) {
                writeInvalidAccessToken(response);
                return;
            }
            chain.doFilter(request, response);
        } catch (AuthenticationException | JwtException | IllegalArgumentException exception) {
            SecurityContextHolder.clearContext();
            writeInvalidAccessToken(response);
        }
    }

    private String accessToken(HttpServletRequest request) {
        String authorizationHeader = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (authorizationHeader != null && !authorizationHeader.isBlank()) {
            return authorizationHeader.startsWith(BEARER_PREFIX)
                    ? authorizationHeader.substring(BEARER_PREFIX.length())
                    : authorizationHeader;
        }

        return authenticationCookieService.accessToken(request).orElse(null);
    }

    private boolean authenticate(String jwt, HttpServletRequest request) {
        if (accessTokenRevocationService.isRevoked(jwt)) {
            return false;
        }

        String userId = jwtUtil.extractUsername(jwt, TokenType.ACCESS);
        if (userId == null) {
            return false;
        }

        UUID userUuid = UUID.fromString(userId);

        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            return true;
        }

        CustomUserDetails userDetails = customUserDetailsService.loadUserById(userUuid);

        if (!jwtUtil.validateToken(jwt, userDetails.getUserId().toString(), TokenType.ACCESS)) {
            return false;
        }

        // Protected requests chỉ được phép với tài khoản ACTIVE.
        if (!userDetails.isEnabled() || !userDetails.isAccountNonLocked()) {
            return false;
        }

        // Lấy session ID từ claim sid trong access token.
        String sessionIdClaim = jwtUtil.extractClaim(
                jwt,
                claims -> claims.get("sid", String.class),
                TokenType.ACCESS);

        if (sessionIdClaim == null || sessionIdClaim.isBlank()) {
            return false;
        }

        UUID sessionId = UUID.fromString(sessionIdClaim);

        // Xác minh session vẫn tồn tại, còn hạn và chưa bị thu hồi.
        boolean validSession = refreshSessionRepository.existsValidSession(
                sessionId,
                userUuid,
                Instant.now(),
                AccountStatus.ACTIVE);

        if (!validSession) {
            return false;
        }

        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                userDetails,
                null,
                userDetails.getAuthorities());

        authentication.setDetails(
                new WebAuthenticationDetailsSource().buildDetails(request));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        return true;
    }

    private void writeInvalidAccessToken(HttpServletResponse response) throws IOException {
        errorResponseWriter.write(response, HttpStatus.UNAUTHORIZED, INVALID_ACCESS_TOKEN_MESSAGE);
    }

}
