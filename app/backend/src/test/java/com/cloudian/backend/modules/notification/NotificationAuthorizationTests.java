package com.cloudian.backend.modules.notification;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

import com.cloudian.backend.commons.enums.NotificationKind;
import com.cloudian.backend.commons.enums.SystemRole;
import com.cloudian.backend.models.UserAccount;
import com.cloudian.backend.modules.notification.dto.NotificationListRequest;
import com.cloudian.backend.modules.notification.dto.NotificationListResponse;
import com.cloudian.backend.modules.notification.dto.NotificationResponse;
import com.cloudian.backend.modules.notification.dto.SendAdminMessageRequest;
import com.cloudian.backend.security.CustomUserDetails;
import com.cloudian.backend.security.MethodSecurityConfig;

@SpringJUnitConfig(classes = {
        MethodSecurityConfig.class,
        NotificationAuthorizationTests.TestConfig.class
})
class NotificationAuthorizationTests {

    @Autowired
    private NotificationController notificationController;

    @Autowired
    private AdminNotificationController adminNotificationController;

    @Autowired
    private NotificationService notificationService;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void allowsAuthenticatedUserToListOwnNotifications() {
        CustomUserDetails principal = authenticateAs(SystemRole.USER);
        NotificationListRequest request = new NotificationListRequest(0, 20);
        NotificationListResponse expected = new NotificationListResponse(List.of(), 0, 20, 0, 0);
        when(notificationService.listNotifications(principal.getUserId(), request)).thenReturn(expected);

        NotificationListResponse response = notificationController.listNotifications(principal, request);

        assertThat(response).isEqualTo(expected);
        verify(notificationService).listNotifications(principal.getUserId(), request);
    }

    @Test
    void deniesRegularUserFromSendingAdminMessage() {
        CustomUserDetails principal = authenticateAs(SystemRole.USER);
        SendAdminMessageRequest request = new SendAdminMessageRequest(
                UUID.randomUUID(),
                "Scheduled maintenance tonight.");

        assertThatThrownBy(() -> adminNotificationController.sendMessage(principal, request))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void allowsAdminToSendMessageUsingAuthenticatedUserIdAsActor() {
        CustomUserDetails principal = authenticateAs(SystemRole.ADMIN);
        SendAdminMessageRequest request = new SendAdminMessageRequest(
                UUID.randomUUID(),
                "Scheduled maintenance tonight.");
        NotificationResponse expected = new NotificationResponse(
                UUID.randomUUID(),
                principal.getUserId(),
                NotificationKind.ADMIN_MESSAGE,
                request.content(),
                null,
                null,
                null,
                null);
        when(notificationService.sendAdminMessage(principal.getUserId(), request)).thenReturn(expected);

        NotificationResponse response = adminNotificationController.sendMessage(principal, request);

        assertThat(response).isEqualTo(expected);
        verify(notificationService).sendAdminMessage(principal.getUserId(), request);
    }

    private static CustomUserDetails authenticateAs(SystemRole role) {
        UserAccount user = new UserAccount();
        user.setId(UUID.randomUUID());
        user.setSystemRole(role);
        CustomUserDetails principal = new CustomUserDetails(user);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
        return principal;
    }

    @TestConfiguration(proxyBeanMethods = false)
    static class TestConfig {

        @Bean
        NotificationService notificationService() {
            return mock(NotificationService.class);
        }

        @Bean
        NotificationController notificationController(NotificationService notificationService) {
            return new NotificationController(notificationService);
        }

        @Bean
        AdminNotificationController adminNotificationController(NotificationService notificationService) {
            return new AdminNotificationController(notificationService);
        }
    }
}
