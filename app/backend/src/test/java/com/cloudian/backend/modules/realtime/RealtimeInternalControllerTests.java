package com.cloudian.backend.modules.realtime;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.cloudian.backend.commons.enums.AccountStatus;
import com.cloudian.backend.commons.enums.SystemRole;
import com.cloudian.backend.models.UserAccount;
import com.cloudian.backend.modules.realtime.dto.RealtimeSessionResponse;
import com.cloudian.backend.security.CustomUserDetails;

class RealtimeInternalControllerTests {

    @Test
    void returnsTheAuthenticatedUserAndValidatedSession() {
        UUID userId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        RealtimeInternalController controller = new RealtimeInternalController();

        RealtimeSessionResponse response = controller.validateSession(
                userDetails(userId),
                sessionId);

        assertThat(response.userId()).isEqualTo(userId);
        assertThat(response.sessionId()).isEqualTo(sessionId);
        assertThat(response.accountStatus()).isEqualTo(AccountStatus.ACTIVE);
    }

    private CustomUserDetails userDetails(UUID userId) {
        UserAccount user = new UserAccount();
        user.setId(userId);
        user.setEmail("person@example.com");
        user.setPasswordHash("password-hash");
        user.setAccountStatus(AccountStatus.ACTIVE);
        user.setSystemRole(SystemRole.USER);
        return new CustomUserDetails(user);
    }
}
