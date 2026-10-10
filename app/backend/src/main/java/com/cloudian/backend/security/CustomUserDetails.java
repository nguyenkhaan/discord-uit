package com.cloudian.backend.security;

import java.util.Collection;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import lombok.Data;

@Data
public class CustomUserDetails implements UserDetails {
    private String username; //Phai dat dung ten la username va password
    private String password; 
    private String userId; 
    public CustomUserDetails(String userId, String username, String password) {
        this.username = username; 
        this.password = password; 
        this.userId = userId; 
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
        return List.of();
    }

}
