package com.cloudian.backend.filters;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.cloudian.backend.commons.constants.RedisKey;
import com.cloudian.backend.exceptions.ErrorResponseWriter;
import com.cloudian.backend.services.RedisService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Limits how often one IP address may call the public auth endpoints
 * (the ones that send emails or check passwords). Over the limit → 429.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Logger LOGGER = LoggerFactory.getLogger(RateLimitFilter.class);
    private static final String TOO_MANY_REQUESTS_MESSAGE = "Too many requests. Please try again later.";

    private record Rule(String name, int limit, Duration window) {
    }

    // Một bản bộ luật cho các api và quy định về bộ luật
    private static final Map<String, Rule> RULES = Map.of(
            "/auth/forgot-password", new Rule("forgot-password", 5, Duration.ofMinutes(15)),
            "/auth/register",        new Rule("register",        5, Duration.ofHours(1)),
            "/auth/login",           new Rule("login",          10, Duration.ofMinutes(5)),
            "/auth/reset-password",  new Rule("reset-password", 10, Duration.ofMinutes(15))
    );

    private final RedisService redisService;
    private final ErrorResponseWriter errorResponseWriter;

    public RateLimitFilter(RedisService redisService, ErrorResponseWriter errorResponseWriter) {
        this.redisService = redisService;
        this.errorResponseWriter = errorResponseWriter;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !HttpMethod.POST.matches(request.getMethod())
                || !RULES.containsKey(request.getServletPath());
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain) throws ServletException, IOException {

        Rule rule = RULES.get(request.getServletPath());
        String key = RedisKey.rateLimit(rule.name(), request.getRemoteAddr());

        long count;
        try {
            // First request creates the counter with TTL = window; Redis deletes it when the window ends.
            count = redisService.increment(key, rule.window());
        } catch (RuntimeException exception) {
            // Redis is down: let the request through instead of blocking every login (fail-open).
            LOGGER.warn("Rate limit check skipped for {}", rule.name(), exception);
            chain.doFilter(request, response);
            return;
        }

        if (count > rule.limit()) {
            response.setHeader(HttpHeaders.RETRY_AFTER, String.valueOf(rule.window().toSeconds()));
            errorResponseWriter.write(response, HttpStatus.TOO_MANY_REQUESTS, TOO_MANY_REQUESTS_MESSAGE);
            return;   // stop here: the controller (and the email) is never reached
        }
        chain.doFilter(request, response);
    }
}