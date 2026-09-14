package com.cloudian.backend.modules.auth;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;
import com.cloudian.backend.modules.auth.dto.LoginRequest;
import com.cloudian.backend.modules.auth.dto.LoginResponse;
import com.cloudian.backend.services.AuthenticationService;

@RestController  
@RequestMapping("/auth") 
public class AuthController {
    @Autowired AuthenticationService authenticationService; 
    @PostMapping ("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        String[] result = authenticationService.authenticate(request.getUsername() , request.getPassword()); 
        System.out.println(result); 
        return ResponseEntity.ok(new LoginResponse(
            result[0] , result[1] 
        )); 
    }

}
 