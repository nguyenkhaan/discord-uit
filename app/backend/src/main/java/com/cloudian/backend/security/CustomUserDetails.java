package com.cloudian.backend.security;

import java.util.Collection;
import java.util.List;
import java.util.Objects;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.cloudian.backend.commons.enums.SystemRole;
import com.cloudian.backend.models.UserAccount;

public class CustomUserDetails implements UserDetails {
    private static final String ROLE_PREFIX = "ROLE_";

    private final String username;
    private final String password;
    private final String userId;
    private final List<GrantedAuthority> authorities;

    public CustomUserDetails(UserAccount user) {
        this.username = user.getEmail();
        this.password = user.getPasswordHash();
        this.userId = Objects.requireNonNull(user.getId(), "user id must not be null").toString();
        SystemRole systemRole = Objects.requireNonNull(user.getSystemRole(), "system role must not be null");
        this.authorities = List.of(new SimpleGrantedAuthority(ROLE_PREFIX + systemRole.name()));
    }

    @Override
    public String getUsername() {
        return username;
    }
    @Override
    public String getPassword() {
        return password;
    }

    public String getUserId() {
        return userId;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }
}
