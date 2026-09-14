package com.cloudian.backend.services;

import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service 
public class CustomUserDetailsService implements UserDetailsService {

    @Override
    public CustomUserDetails loadUserByUsername(String username)
            throws UsernameNotFoundException {

        String myUsername = "cloudian";
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String password = encoder.encode("cloudian"); 
        String userId = "A very long userid with 12 characters";
        return new CustomUserDetails(
            userId,
            myUsername,
            password
        );
    }
}