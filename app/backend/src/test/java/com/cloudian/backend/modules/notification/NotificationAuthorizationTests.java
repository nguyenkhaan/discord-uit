package com.cloudian.backend.modules.notification;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

import com.cloudian.backend.commons.enums.SystemRole;
import com.cloudian.backend.messagings.KafkaEventProducer;
import com.cloudian.backend.models.UserAccount;
import com.cloudian.backend.modules.notification.dto.NotificationRequest;
import com.cloudian.backend.security.CustomUserDetails;
import com.cloudian.backend.security.MethodSecurityConfig;

@SpringJUnitConfig(classes = {
        MethodSecurityConfig.class,
        NotificationController.class,
        NotificationAuthorizationTests.TestConfig.class
})
class NotificationAuthorizationTests {

    private final NotificationController notificationController;
    private final KafkaEventProducer kafkaEventProducer;

    @Autowired
    NotificationAuthorizationTests(
            NotificationController notificationController,
            KafkaEventProducer kafkaEventProducer
    ) {
        this.notificationController = notificationController;
        this.kafkaEventProducer = kafkaEventProducer;
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void rejectsUnauthenticatedPublishing() {
        NotificationRequest request = new NotificationRequest("user-1", "Hello");

        assertThatThrownBy(() -> notificationController.publish(request))
                .isInstanceOf(AuthenticationCredentialsNotFoundException.class);
    }

    @Test
    void allowsUserRoleToPublish() {
        authenticateAsUser();
        NotificationRequest request = new NotificationRequest("user-1", "Hello");

        var response = notificationController.publish(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.ACCEPTED);
        verify(kafkaEventProducer).publish("notification.events.v1", "user-1", "Hello");
    }

    private static void authenticateAsUser() {
        UserAccount user = new UserAccount();
        user.setId(UUID.randomUUID());
        user.setSystemRole(SystemRole.USER);

        CustomUserDetails principal = new CustomUserDetails(user);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
    }

    @Configuration(proxyBeanMethods = false)
    static class TestConfig {

        @Bean
        KafkaEventProducer kafkaEventProducer() {
            return mock(KafkaEventProducer.class);
        }
    }
}
