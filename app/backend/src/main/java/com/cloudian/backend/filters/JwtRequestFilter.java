package com.cloudian.backend.filters;

import java.io.IOException;

import com.cloudian.backend.commons.enums.TokenType;
import com.cloudian.backend.exceptions.ErrorResponseWriter;
import com.cloudian.backend.services.CustomUserDetails;
import com.cloudian.backend.services.CustomUserDetailsService;
import com.cloudian.backend.utils.JwtUtil;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtRequestFilter extends OncePerRequestFilter {

    private static final String INVALID_ACCESS_TOKEN_MESSAGE = "The access token is invalid or expired.";

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService customUserDetailsService;
    private final ErrorResponseWriter errorResponseWriter;

    public JwtRequestFilter(
            JwtUtil jwtUtil,
            CustomUserDetailsService customUserDetailsService,
            ErrorResponseWriter errorResponseWriter
    ) {
        this.jwtUtil = jwtUtil;
        this.customUserDetailsService = customUserDetailsService;
        this.errorResponseWriter = errorResponseWriter;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain
    ) throws ServletException, IOException {
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
        String username = jwtUtil.extractUsername(jwt, TokenType.ACCESS);
        if (username == null) {
            return false;
        }
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            return true;
        }

        CustomUserDetails userDetails = (CustomUserDetails) customUserDetailsService.loadUserByUsername(username);
        if (!jwtUtil.validateToken(jwt, userDetails.getUserId(), TokenType.ACCESS)) {
            return false;
        }

        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                userDetails,
                null,
                userDetails.getAuthorities()
        );
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);
        return true;
    }

    private void writeInvalidAccessToken(HttpServletResponse response) throws IOException {
        errorResponseWriter.write(response, HttpStatus.UNAUTHORIZED, INVALID_ACCESS_TOKEN_MESSAGE);
    }

}
