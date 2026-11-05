package com.cloudian.backend.modules.user;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cloudian.backend.modules.user.dto.UserLookupResponse;

import lombok.RequiredArgsConstructor;

/** /api/users/lookup — finds one active account by exact email. No partial search, to avoid user enumeration. */
@RequiredArgsConstructor
@RestController
@RequestMapping("/users")
public class UserLookupController {

    private final UserService userService;

    @GetMapping("/lookup")
    public UserLookupResponse lookupByEmail(@RequestParam("email") String email) {
        return userService.lookupByEmail(email);
    }
}
