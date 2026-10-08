package com.cloudian.backend.services;

import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.cloudian.backend.modules.auth.entity.UserAccount;
import com.cloudian.backend.modules.auth.repository.UserAccountRepository;

import lombok.RequiredArgsConstructor;

@Service 
@RequiredArgsConstructor 
public class CustomUserDetailsService implements UserDetailsService {
    private final UserAccountRepository userRepository;

    @Override
    public CustomUserDetails loadUserByUsername(String email) {
        UserAccount u = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("not found"));
        return new CustomUserDetails(u.getId(), u.getEmail(), u.getPasswordHash(),
                u.getSystemRole(), u.getAccountStatus());
    }
}