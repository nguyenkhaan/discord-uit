package com.cloudian.backend.filters;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.cloudian.backend.commons.enums.TokenType;
import com.cloudian.backend.services.CustomUserDetails;
import com.cloudian.backend.services.CustomUserDetailsService;
import com.cloudian.backend.utils.JwtUtil;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component 
public class JwtRequestFilter extends OncePerRequestFilter {
    @Autowired  
    private final JwtUtil jwtUtil; 
    @Autowired  
    private final CustomUserDetailsService customUserDetailsService; 
    public JwtRequestFilter(
        JwtUtil jwtUtil, CustomUserDetailsService customUserDetailsService
    ) {
        this.jwtUtil = jwtUtil; 
        this.customUserDetailsService = customUserDetailsService; 
    } 
    @Override  
    protected void doFilterInternal(
        HttpServletRequest request, 
        HttpServletResponse response, 
        FilterChain chain 
    ) throws ServletException, IOException {
        final String authorizationHeader = request.getHeader("Authorization"); 
                String username = null;
        String jwt = null;
        if (authorizationHeader != null &&
                authorizationHeader.startsWith("Bearer ")) {

            jwt = authorizationHeader.substring(7);
            username = jwtUtil.extractUsername(jwt , TokenType.ACCESS);
        }

        if (username != null &&
                SecurityContextHolder.getContext().getAuthentication() == null) {

            CustomUserDetails userDetails =
                    (CustomUserDetails)customUserDetailsService.loadUserByUsername(username);
            if (jwtUtil.validateToken(jwt, userDetails.getUserId() , TokenType.ACCESS)) {

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );

                authentication.setDetails(
                        new WebAuthenticationDetailsSource()
                                .buildDetails(request)
                );

                SecurityContextHolder.getContext()
                        .setAuthentication(authentication);
            }
        }
        chain.doFilter(request, response);
    }
}
