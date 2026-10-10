package com.cloudian.backend.services;

import java.util.UUID;

import com.cloudian.backend.security.CustomUserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cloudian.backend.models.UserAccount;
import com.cloudian.backend.repositories.UserAccountRepository;
import com.cloudian.backend.utils.EmailUtil;

/**
 * Loads users from the user_account table.
 * - loadUserByUsername(email): used by the login flow (the "username" field of LoginRequest is the email).
 * - loadUserById(id): used by JwtRequestFilter, because the JWT subject is the user id.
 */
@Service
public class CustomUserDetailsService implements UserDetailsService {

    private static final String USER_NOT_FOUND_MESSAGE = "User not found.";

    private final UserAccountRepository userAccountRepository;

    public CustomUserDetailsService(UserAccountRepository userAccountRepository) {
        this.userAccountRepository = userAccountRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public CustomUserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userAccountRepository.findByEmail(EmailUtil.normalize(username))
                .map(CustomUserDetailsService::toUserDetails)
                .orElseThrow(() -> new UsernameNotFoundException(USER_NOT_FOUND_MESSAGE));
    }

    @Transactional(readOnly = true)
    public CustomUserDetails loadUserById(UUID userId) throws UsernameNotFoundException {
        return userAccountRepository.findById(userId)
                .map(CustomUserDetailsService::toUserDetails)
                .orElseThrow(() -> new UsernameNotFoundException(USER_NOT_FOUND_MESSAGE));
    }

    private static CustomUserDetails toUserDetails(UserAccount user) {
        // password_hash is null for UIT accounts, so password login always fails for them.
        return new CustomUserDetails(user);
    }
}
