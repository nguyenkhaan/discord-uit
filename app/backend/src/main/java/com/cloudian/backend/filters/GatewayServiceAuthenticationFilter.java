package com.cloudian.backend.filters;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.cloudian.backend.exceptions.ErrorResponse;
import com.cloudian.backend.exceptions.ErrorResponseWriter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class GatewayServiceAuthenticationFilter extends OncePerRequestFilter {

    private static final String INTERNAL_REALTIME_PATH = "/internal/realtime";
    private static final String GATEWAY_TOKEN_HEADER = "X-Gateway-Token";

    private final byte[] expectedToken;
    private final ErrorResponseWriter errorResponseWriter;

    public GatewayServiceAuthenticationFilter(
            @Value("${app.realtime.gateway-token}") String gatewayToken,
            ErrorResponseWriter errorResponseWriter) {

        if (gatewayToken == null || gatewayToken.isBlank()) {
            throw new IllegalStateException(
                    "The realtime gateway token must be configured.");
        }

        this.expectedToken = gatewayToken.getBytes(StandardCharsets.UTF_8);
        this.errorResponseWriter = errorResponseWriter;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String servletPath = request.getServletPath();

        return !servletPath.equals(INTERNAL_REALTIME_PATH)
                && !servletPath.startsWith(INTERNAL_REALTIME_PATH + "/");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain) throws ServletException, IOException {

        String providedToken = request.getHeader(GATEWAY_TOKEN_HEADER);

        if (!isValidToken(providedToken)) {
            errorResponseWriter.write(
                    response,
                    HttpStatus.UNAUTHORIZED,
                    ErrorResponse.defaultMessage(HttpStatus.UNAUTHORIZED));
            return;
        }

        chain.doFilter(request, response);
    }

    private boolean isValidToken(String providedToken) {
        if (providedToken == null || providedToken.isBlank()) {
            return false;
        }

        byte[] providedTokenBytes =
                providedToken.getBytes(StandardCharsets.UTF_8);

        return MessageDigest.isEqual(
                expectedToken,
                providedTokenBytes);
    }
}