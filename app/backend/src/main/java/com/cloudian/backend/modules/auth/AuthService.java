/***
 * Khong thuc hien luu access token lien tuc vao ben trong redis. Chi can luu access token 
 * vao do, thuc hien danh dau REVOKED = 1 khi ma thuc hien logout. Thoi gian luu tru se dai dai 
 * Request Filter kiem tra ben trong redis co cai key nao bang 1 khong => Neu co thi chan request
 * mot chut, toi khi access token het han thi se duoc xoa khoi redis de tranh access token bi lam dung 
 */
package com.cloudian.backend.modules.auth;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import com.cloudian.backend.models.RefreshSession;
import com.cloudian.backend.modules.auth.dto.LoginRequest;
import com.cloudian.backend.modules.auth.dto.LoginResponse;
import com.cloudian.backend.repositories.RefreshSessionRepository;
import com.cloudian.backend.security.CustomUserDetails;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cloudian.backend.commons.constants.RedisKey;
import com.cloudian.backend.commons.enums.AccountStatus;
import com.cloudian.backend.commons.enums.AccountType;
import com.cloudian.backend.commons.enums.SystemRole;
import com.cloudian.backend.commons.enums.TokenType;
import com.cloudian.backend.events.AccountVerificationRequestedEvent;
import com.cloudian.backend.exceptions.ApiException;
import com.cloudian.backend.models.UserAccount;
import com.cloudian.backend.modules.auth.dto.RegisterRequest;
import com.cloudian.backend.modules.auth.dto.RegisterResponse;
import com.cloudian.backend.repositories.UserAccountRepository;
import com.cloudian.backend.services.RedisService;
import com.cloudian.backend.utils.EmailUtil;
import com.cloudian.backend.utils.JwtUtil;
import com.cloudian.backend.utils.TokenHashUtil;

import io.jsonwebtoken.JwtException;

@Service
public class AuthService {

    private static final String UIT_EMAIL_MESSAGE =
            "UIT email addresses cannot register a personal account. Please sign in with your UIT account.";
    private static final String EMAIL_TAKEN_MESSAGE = "This email is already registered.";
    private static final String INVALID_TOKEN_MESSAGE = "The token is invalid or expired.";

    private final UserAccountRepository userAccountRepository;
    private final RedisService redisService;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationEventPublisher eventPublisher;
    private final Duration emailVerificationTtl;
    private final RefreshSessionRepository refreshSessionRepository;
    private final AuthenticationManager authenticationManager;

    public AuthService(
            UserAccountRepository userAccountRepository,
            RedisService redisService,
            JwtUtil jwtUtil,
            PasswordEncoder passwordEncoder,
            ApplicationEventPublisher eventPublisher,
            @Value("${app.jwt.email-verification-ttl:PT48H}") Duration emailVerificationTtl,
            RefreshSessionRepository refreshSessionRepository,
            AuthenticationManager authenticationManager
    ) {
        this.userAccountRepository = userAccountRepository;
        this.redisService = redisService;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
        this.eventPublisher = eventPublisher;
        this.emailVerificationTtl = emailVerificationTtl;
        this.refreshSessionRepository = refreshSessionRepository;
        this.authenticationManager = authenticationManager;
    }

    // ============ LOG IN ============

    @Transactional
    public LoginResponse login(LoginRequest request) {
        // check email and password
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

        // generate token for this log in session
        return issueTokens(UUID.fromString(userDetails.getUserId()), userDetails.getUsername());
    }

    private LoginResponse issueTokens(UUID userId, String email) {
        String[] tokens = jwtUtil.generateToken(userId.toString(), email);
        String accessToken = tokens[0];
        String refreshToken = tokens[1];

        RefreshSession session = new RefreshSession();
        session.setUser(userAccountRepository.getReferenceById(userId));
        session.setTokenHash(TokenHashUtil.sha256Hex(refreshToken));
        session.setExpiresAt(jwtUtil.extractExpiration(refreshToken, TokenType.REFRESH).toInstant());
        refreshSessionRepository.save(session);

        return new LoginResponse(accessToken, refreshToken);
    }


    @Transactional
    public RegisterResponse registerPersonalAccount(RegisterRequest request) {
        // Normalize first so "A@UIT.EDU.VN" cannot bypass the UIT check or create a duplicate.
        String email = EmailUtil.normalize(request.email());

        if (EmailUtil.isUitEmail(email)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, UIT_EMAIL_MESSAGE);
        }
        if (userAccountRepository.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, EMAIL_TAKEN_MESSAGE);
        }

        UserAccount user = new UserAccount();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setFullName(request.fullName().strip());
        user.setAccountType(AccountType.PERSONAL);
        user.setAccountStatus(AccountStatus.UNVERIFIED);
        user.setSystemRole(SystemRole.USER);

        try {
            // Flush now so a concurrent duplicate registration surfaces as 409, not 500.
            user = userAccountRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException exception) {
            throw new ApiException(HttpStatus.CONFLICT, EMAIL_TAKEN_MESSAGE);
        }

        String rawToken = jwtUtil.generateEmailVerificationToken(user.getId().toString());
        String tokenKey = RedisKey.emailVerification(TokenHashUtil.sha256Hex(rawToken));
        redisService.set(tokenKey, user.getId().toString(), emailVerificationTtl);
        eventPublisher.publishEvent(
                new AccountVerificationRequestedEvent(user.getEmail(), user.getFullName(), rawToken));

        return RegisterResponse.from(user);
    }

    @Transactional
    public void verifyEmail(String rawToken) {
        UUID userId = extractVerificationUserId(rawToken);
        String tokenKey = RedisKey.emailVerification(TokenHashUtil.sha256Hex(rawToken));
        String storedUserId = redisService.getAndDelete(tokenKey).orElseThrow(AuthService::invalidToken);
        if (!storedUserId.equals(userId.toString())) {
            throw invalidToken();
        }

        UserAccount user = userAccountRepository.findById(userId).orElseThrow(AuthService::invalidToken);

        if (user.getEmailVerifiedAt() == null) {
            user.setEmailVerifiedAt(Instant.now());
        }
        // A banned account stays banned even if it verifies its email.
        if (user.getAccountStatus() == AccountStatus.UNVERIFIED) {
            user.setAccountStatus(AccountStatus.ACTIVE);
        }
    }

    private UUID extractVerificationUserId(String rawToken) {
        try {
            String subject = jwtUtil.extractUsername(rawToken, TokenType.EMAIL_VERIFICATION);
            return UUID.fromString(subject);
        } catch (JwtException | IllegalArgumentException exception) {
            throw invalidToken();
        }
    }

    private static ApiException invalidToken() {
        return new ApiException(HttpStatus.BAD_REQUEST, INVALID_TOKEN_MESSAGE);
    }
}
