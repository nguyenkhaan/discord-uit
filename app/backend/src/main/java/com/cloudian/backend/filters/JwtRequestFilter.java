package com.cloudian.backend.filters;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.cloudian.backend.commons.enums.AccountStatus;
import com.cloudian.backend.commons.enums.TokenType;
import com.cloudian.backend.exceptions.ErrorResponseWriter;
import com.cloudian.backend.modules.auth.AuthPrincipal;
import com.cloudian.backend.modules.auth.entity.RefreshSession;
import com.cloudian.backend.modules.auth.entity.UserAccount;
import com.cloudian.backend.modules.auth.repository.RefreshSessionRepository;
import com.cloudian.backend.modules.auth.repository.UserAccountRepository;
import com.cloudian.backend.services.CustomUserDetails;
import com.cloudian.backend.services.CustomUserDetailsService;
import com.cloudian.backend.utils.JwtUtil;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@RequiredArgsConstructor
public class JwtRequestFilter extends OncePerRequestFilter {

    private static final String INVALID_ACCESS_TOKEN_MESSAGE = "The access token is invalid or expired.";

    private final JwtUtil jwtUtil;
    // private final CustomUserDetailsService customUserDetailsService;
    private final RefreshSessionRepository refreshSessionRepository;
    private final UserAccountRepository userAccountRepository;
    private final ErrorResponseWriter errorResponseWriter;

    // public JwtRequestFilter(
    // JwtUtil jwtUtil,
    // // CustomUserDetailsService customUserDetailsService,
    // ErrorResponseWriter errorResponseWriter) {
    // this.jwtUtil = jwtUtil;
    // // this.customUserDetailsService = customUserDetailsService;
    // this.errorResponseWriter = errorResponseWriter;
    // }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain) throws ServletException, IOException {
        String authorizationHeader = request.getHeader("Authorization");
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        try {
            if (!authenticate(authorizationHeader.substring(7), request)) {
                writeInvalidAccessToken(response);
                return;
            }
            chain.doFilter(request, response);
        } catch (AuthenticationException | JwtException | IllegalArgumentException exception) {
            SecurityContextHolder.clearContext();
            writeInvalidAccessToken(response);
        }
    }

    private boolean authenticate(String jwt, HttpServletRequest request) {
        Claims c = jwtUtil.extractAllClaims(jwt, TokenType.ACCESS); // verify chữ ký + hạn
        String sidClaim = c.get("sid", String.class);
        if (sidClaim == null || c.getSubject() == null)
            return false;
        UUID userId = UUID.fromString(c.getSubject());
        UUID sid = UUID.fromString(sidClaim);

        RefreshSession s = refreshSessionRepository.findById(sid).orElse(null);
        if (s == null || s.getRevokedAt() != null
                || s.getExpiresAt().isBefore(Instant.now()) || !s.getUserId().equals(userId))
            return false;

        UserAccount user = userAccountRepository.findById(userId).orElse(null);
        if (user == null || user.getAccountStatus() != AccountStatus.ACTIVE)
            return false;

        AuthPrincipal principal = new AuthPrincipal(userId, user.getSystemRole(), sid);
        var authentication = new UsernamePasswordAuthenticationToken(
                principal, null, List.of(new SimpleGrantedAuthority("ROLE_" + user.getSystemRole())));
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);
        return true;
    }

    private void writeInvalidAccessToken(HttpServletResponse response) throws IOException {
        errorResponseWriter.write(response, HttpStatus.UNAUTHORIZED, INVALID_ACCESS_TOKEN_MESSAGE);
    }

}
