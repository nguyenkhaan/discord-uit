package com.cloudian.backend.services;

import com.cloudian.backend.security.CustomUserDetails;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import com.cloudian.backend.utils.JwtUtil;

@Service 
public class AuthenticationService {
    @Autowired  
    private JwtUtil jwtUtil; 
    @Autowired
    private AuthenticationManager authenticationManager;
    public String[] authenticate(String username, String password) {
        Authentication authentication = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(username, password));
        
        final CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        return jwtUtil.generateToken(userDetails.getUserId() , userDetails.getUsername());
    }
    // public User registerUser(User user) {
    //     user.setPassword(passwordEncoder.encode(user.getPassword()));
    //     return userRepository.save(user);
    // }
}
