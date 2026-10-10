package com.cloudian.backend.modules.user;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cloudian.backend.exceptions.ApiException;
import com.cloudian.backend.models.UserAccount;
import com.cloudian.backend.modules.user.dto.MeResponse;
import com.cloudian.backend.modules.user.dto.UpdateMeRequest;
import com.cloudian.backend.repositories.UserAccountRepository;

@Service
public class UserService {

    private final UserAccountRepository userAccountRepository;

    public UserService(UserAccountRepository userAccountRepository) {
        this.userAccountRepository = userAccountRepository;
    }

    @Transactional(readOnly = true)
    public MeResponse getMe(UUID userId) {
        return MeResponse.from(findUser(userId));
    }

    @Transactional
    public MeResponse updateMe(UUID userId, UpdateMeRequest request) {
        UserAccount user = findUser(userId);

        if (request.fullName() != null) {
            user.setFullName(request.fullName().strip());
        }

        // Flush so auditing fills updated_at before the response is built.
        return MeResponse.from(userAccountRepository.saveAndFlush(user));
    }

    private UserAccount findUser(UUID userId) {
        return userAccountRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found."));
    }
}
