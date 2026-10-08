package com.cloudian.backend.services;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.cloudian.backend.commons.enums.AccountStatus;
import com.cloudian.backend.commons.enums.SystemRole;

import lombok.Data;


@Data

public class CustomUserDetails implements UserDetails {
    private final UUID userId;
    private final String username;         // = email
    private final String password;         // hash
    private final SystemRole role;
    private final AccountStatus status;
    public CustomUserDetails(UUID userId, String username, String password, SystemRole role, AccountStatus status) {
    this.userId = userId;
    this.username = username;
    this.password = password;
    this.role = role;
    this.status = status;
}
    @Override
    public String getUsername() {
        return username;
    }
    @Override
    public String getPassword() {
        return password;
    }
   @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

}
