package com.cloudian.backend.modules.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

import com.cloudian.backend.repositories.RefreshSessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.cloudian.backend.commons.constants.RedisKey;
import com.cloudian.backend.commons.enums.AccountStatus;
import com.cloudian.backend.commons.enums.TokenType;
import com.cloudian.backend.events.AccountVerificationRequestedEvent;
import com.cloudian.backend.exceptions.ApiException;
import com.cloudian.backend.models.UserAccount;
import com.cloudian.backend.modules.auth.dto.RegisterRequest;
import com.cloudian.backend.repositories.UserAccountRepository;
import com.cloudian.backend.services.RedisService;
import com.cloudian.backend.utils.JwtUtil;
import com.cloudian.backend.utils.TokenHashUtil;

class AuthServiceTests {

    private static final Duration TOKEN_TTL = Duration.ofHours(48);
    private static final String TOKEN_SECRET = "email-verification-secret-that-is-long-enough-for-hmac-sha";

    private UserAccountRepository userAccountRepository;
    private RedisService redisService;
    private PasswordEncoder passwordEncoder;
    private ApplicationEventPublisher eventPublisher;
    private JwtUtil jwtUtil;
    private AuthService authService;
    private AuthenticationManager authenticationManager;
    private RefreshSessionRepository refreshSessionRepository;

    @BeforeEach
    void setUp() {
        userAccountRepository = mock(UserAccountRepository.class);
        redisService = mock(RedisService.class);
        passwordEncoder = mock(PasswordEncoder.class);
        eventPublisher = mock(ApplicationEventPublisher.class);
        jwtUtil = new JwtUtil(TOKEN_SECRET, TOKEN_TTL);
        refreshSessionRepository = mock(RefreshSessionRepository.class);
        authenticationManager = mock(AuthenticationManager.class);
        authService = new AuthService(
                userAccountRepository,
                redisService,
                jwtUtil,
                passwordEncoder,
                eventPublisher,
                TOKEN_TTL,
                refreshSessionRepository,
                authenticationManager);
    }

    @Test
    void registrationStoresOnlyTheTokenHashAndPublishesTheRawToken() {
        UUID userId = UUID.randomUUID();
        when(passwordEncoder.encode("password123")).thenReturn("password-hash");
        when(userAccountRepository.saveAndFlush(any(UserAccount.class))).thenAnswer(invocation -> {
            UserAccount user = invocation.getArgument(0);
            user.setId(userId);
            return user;
        });

        authService.registerPersonalAccount(
                new RegisterRequest("person@example.com", "password123", "Person"));

        ArgumentCaptor<AccountVerificationRequestedEvent> eventCaptor =
                ArgumentCaptor.forClass(AccountVerificationRequestedEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        String rawToken = eventCaptor.getValue().rawToken();
        String tokenKey = RedisKey.emailVerification(TokenHashUtil.sha256Hex(rawToken));

        verify(redisService).set(tokenKey, userId.toString(), TOKEN_TTL);
        assertThat(jwtUtil.extractUsername(rawToken, TokenType.EMAIL_VERIFICATION))
                .isEqualTo(userId.toString());
    }

    @Test
    void verificationConsumesTheRedisTokenAndActivatesTheUser() {
        UUID userId = UUID.randomUUID();
        String rawToken = jwtUtil.generateEmailVerificationToken(userId.toString());
        String tokenKey = RedisKey.emailVerification(TokenHashUtil.sha256Hex(rawToken));
        UserAccount user = new UserAccount();
        user.setAccountStatus(AccountStatus.UNVERIFIED);

        when(redisService.getAndDelete(tokenKey)).thenReturn(Optional.of(userId.toString()));
        when(userAccountRepository.findById(userId)).thenReturn(Optional.of(user));

        authService.verifyEmail(rawToken);

        assertThat(user.getAccountStatus()).isEqualTo(AccountStatus.ACTIVE);
        assertThat(user.getEmailVerifiedAt()).isNotNull();
    }

    @Test
    void verificationRejectsAReplayAfterTheRedisTokenIsGone() {
        UUID userId = UUID.randomUUID();
        String rawToken = jwtUtil.generateEmailVerificationToken(userId.toString());
        String tokenKey = RedisKey.emailVerification(TokenHashUtil.sha256Hex(rawToken));
        when(redisService.getAndDelete(tokenKey)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.verifyEmail(rawToken))
                .isInstanceOfSatisfying(ApiException.class, exception ->
                        assertThat(exception.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
        verify(userAccountRepository, never()).findById(any());
    }
}
