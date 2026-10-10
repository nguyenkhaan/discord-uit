package com.cloudian.backend.filters;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import com.cloudian.backend.commons.enums.AccountStatus;
import com.cloudian.backend.commons.enums.SystemRole;
import com.cloudian.backend.commons.enums.TokenType;
import com.cloudian.backend.models.UserAccount;
import com.cloudian.backend.security.CustomUserDetails;
import com.cloudian.backend.services.AccessTokenRevocationService;
import com.cloudian.backend.services.CustomUserDetailsService;
import com.cloudian.backend.utils.JwtUtil;

import jakarta.servlet.FilterChain;

class JwtRequestFilterTests {

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void rejectsARevokedAccessTokenBeforeContinuingTheFilterChain() throws Exception {
        AccessTokenRevocationService revocationService = mock(AccessTokenRevocationService.class);
        FilterChain chain = mock(FilterChain.class);
        JwtRequestFilter filter = new JwtRequestFilter(
                mock(JwtUtil.class),
                mock(CustomUserDetailsService.class),
                revocationService);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer access-token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        when(revocationService.isRevoked("access-token")).thenReturn(true);

        filter.doFilter(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(401);
        verify(chain, never()).doFilter(request, response);
    }

    @Test
    void acceptsAValidAccessTokenThatHasNotBeenRevoked() throws Exception {
        UUID userId = UUID.randomUUID();
        JwtUtil jwtUtil = mock(JwtUtil.class);
        CustomUserDetailsService userDetailsService = mock(CustomUserDetailsService.class);
        AccessTokenRevocationService revocationService = mock(AccessTokenRevocationService.class);
        FilterChain chain = mock(FilterChain.class);
        JwtRequestFilter filter = new JwtRequestFilter(jwtUtil, userDetailsService, revocationService);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer access-token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        CustomUserDetails userDetails = userDetails(userId);
        when(revocationService.isRevoked("access-token")).thenReturn(false);
        when(jwtUtil.extractUsername("access-token", TokenType.ACCESS)).thenReturn(userId.toString());
        when(userDetailsService.loadUserById(userId)).thenReturn(userDetails);
        when(jwtUtil.validateToken("access-token", userId.toString(), TokenType.ACCESS)).thenReturn(true);

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication().getPrincipal())
                .isEqualTo(userDetails);
    }

    private CustomUserDetails userDetails(UUID userId) {
        UserAccount user = new UserAccount();
        user.setId(userId);
        user.setEmail("person@example.com");
        user.setPasswordHash("password-hash");
        user.setAccountStatus(AccountStatus.ACTIVE);
        user.setSystemRole(SystemRole.USER);
        return new CustomUserDetails(user);
    }
}
