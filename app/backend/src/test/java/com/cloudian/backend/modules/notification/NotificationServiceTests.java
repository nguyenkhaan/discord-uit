package com.cloudian.backend.modules.notification;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;

import com.cloudian.backend.commons.enums.NotificationKind;
import com.cloudian.backend.commons.enums.OutboxStatus;
import com.cloudian.backend.exceptions.ApiException;
import com.cloudian.backend.models.Notification;
import com.cloudian.backend.models.OutboxEvent;
import com.cloudian.backend.models.UserAccount;
import com.cloudian.backend.modules.notification.dto.NotificationListRequest;
import com.cloudian.backend.modules.notification.dto.NotificationListResponse;
import com.cloudian.backend.modules.notification.dto.NotificationResponse;
import com.cloudian.backend.modules.notification.dto.SendAdminMessageRequest;
import com.cloudian.backend.repositories.NotificationRepository;
import com.cloudian.backend.repositories.OutboxEventRepository;
import com.cloudian.backend.repositories.UserAccountRepository;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTests {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserAccountRepository userAccountRepository;

    @Mock
    private OutboxEventRepository outboxEventRepository;

    @Spy
    private JsonMapper jsonMapper = JsonMapper.builder().build();

    @InjectMocks
    private NotificationService notificationService;

    @Test
    void listsOnlyVisibleNotificationsWithPageMetadataAndNewestFirst() {
        UUID recipientUserId = UUID.randomUUID();
        Notification notification = notification();
        when(notificationRepository.findByRecipient_IdAndDeletedAtIsNull(
                eq(recipientUserId),
                any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(notification), PageRequest.of(1, 10), 21));

        NotificationListResponse response = notificationService.listNotifications(
                recipientUserId,
                new NotificationListRequest(1, 10));

        assertThat(response.notifications()).containsExactly(NotificationResponse.from(notification));
        assertThat(response.page()).isEqualTo(1);
        assertThat(response.size()).isEqualTo(10);
        assertThat(response.totalElements()).isEqualTo(21);
        assertThat(response.totalPages()).isEqualTo(3);

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(notificationRepository).findByRecipient_IdAndDeletedAtIsNull(
                eq(recipientUserId),
                pageableCaptor.capture());
        assertThat(pageableCaptor.getValue().getSort().getOrderFor("createdAt").isDescending()).isTrue();
    }

    @Test
    void returnsNotificationDetailOnlyWithinRecipientScope() {
        UUID recipientUserId = UUID.randomUUID();
        Notification notification = notification();
        when(notificationRepository.findByIdAndRecipient_IdAndDeletedAtIsNull(
                notification.getId(),
                recipientUserId))
                .thenReturn(Optional.of(notification));

        NotificationResponse response = notificationService.getNotification(
                recipientUserId,
                notification.getId());

        assertThat(response).isEqualTo(NotificationResponse.from(notification));
    }

    @Test
    void hidesMissingDeletedOrForeignNotificationAsNotFound() {
        UUID recipientUserId = UUID.randomUUID();
        UUID notificationId = UUID.randomUUID();
        when(notificationRepository.findByIdAndRecipient_IdAndDeletedAtIsNull(
                notificationId,
                recipientUserId))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> notificationService.getNotification(recipientUserId, notificationId))
                .isInstanceOfSatisfying(ApiException.class, exception -> {
                    assertThat(exception.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(exception.getMessage()).isEqualTo("Notification not found.");
                });
    }

    @Test
    void countsOnlyUnreadAndVisibleNotificationsForRecipient() {
        UUID recipientUserId = UUID.randomUUID();
        when(notificationRepository.countByRecipient_IdAndReadAtIsNullAndDeletedAtIsNull(recipientUserId))
                .thenReturn(4L);

        assertThat(notificationService.getUnreadCount(recipientUserId).unreadCount()).isEqualTo(4L);
    }

    @Test
    void marksVisibleNotificationAsRead() {
        UUID recipientUserId = UUID.randomUUID();
        Notification notification = notification();
        when(notificationRepository.findByIdAndRecipient_IdAndDeletedAtIsNull(
                notification.getId(),
                recipientUserId))
                .thenReturn(Optional.of(notification));

        notificationService.markAsRead(recipientUserId, notification.getId());

        assertThat(notification.getReadAt()).isNotNull();
        verify(notificationRepository).save(notification);
    }

    @Test
    void doesNotOverwriteExistingReadTimestamp() {
        UUID recipientUserId = UUID.randomUUID();
        Notification notification = notification();
        Instant originalReadAt = Instant.parse("2026-10-22T01:00:00Z");
        notification.setReadAt(originalReadAt);
        when(notificationRepository.findByIdAndRecipient_IdAndDeletedAtIsNull(
                notification.getId(),
                recipientUserId))
                .thenReturn(Optional.of(notification));

        notificationService.markAsRead(recipientUserId, notification.getId());

        assertThat(notification.getReadAt()).isEqualTo(originalReadAt);
        verify(notificationRepository, never()).save(notification);
    }

    @Test
    void softDeletesVisibleNotification() {
        UUID recipientUserId = UUID.randomUUID();
        Notification notification = notification();
        when(notificationRepository.findByIdAndRecipient_IdAndDeletedAtIsNull(
                notification.getId(),
                recipientUserId))
                .thenReturn(Optional.of(notification));

        notificationService.deleteNotification(recipientUserId, notification.getId());

        assertThat(notification.getDeletedAt()).isNotNull();
        verify(notificationRepository).save(notification);
    }

    @Test
    void createsAdminMessageAndPendingOutboxEventInOneOperation() throws Exception {
        UUID adminUserId = UUID.randomUUID();
        UUID recipientUserId = UUID.randomUUID();
        UUID notificationId = UUID.randomUUID();
        UserAccount admin = user(adminUserId);
        UserAccount recipient = user(recipientUserId);
        when(userAccountRepository.findById(adminUserId)).thenReturn(Optional.of(admin));
        when(userAccountRepository.findById(recipientUserId)).thenReturn(Optional.of(recipient));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> {
            Notification savedNotification = invocation.getArgument(0);
            savedNotification.setId(notificationId);
            savedNotification.setCreatedAt(Instant.parse("2026-10-23T02:00:00Z"));
            return savedNotification;
        });

        NotificationResponse response = notificationService.sendAdminMessage(
                adminUserId,
                new SendAdminMessageRequest(recipientUserId, "Scheduled maintenance tonight."));

        ArgumentCaptor<Notification> notificationCaptor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(notificationCaptor.capture());
        Notification savedNotification = notificationCaptor.getValue();
        assertThat(savedNotification.getActor()).isSameAs(admin);
        assertThat(savedNotification.getRecipient()).isSameAs(recipient);
        assertThat(savedNotification.getKind()).isEqualTo(NotificationKind.ADMIN_MESSAGE);
        assertThat(savedNotification.getContent()).isEqualTo("Scheduled maintenance tonight.");
        assertThat(response.id()).isEqualTo(notificationId);

        ArgumentCaptor<OutboxEvent> outboxCaptor = ArgumentCaptor.forClass(OutboxEvent.class);
        verify(outboxEventRepository).save(outboxCaptor.capture());
        OutboxEvent outboxEvent = outboxCaptor.getValue();
        assertThat(outboxEvent.getEntityType()).isEqualTo("NOTIFICATION");
        assertThat(outboxEvent.getEntityId()).isEqualTo(notificationId);
        assertThat(outboxEvent.getEventType()).isEqualTo("NOTIFICATION_CREATED");
        assertThat(outboxEvent.getStatus()).isEqualTo(OutboxStatus.PENDING);

        JsonNode payload = jsonMapper.readTree(outboxEvent.getPayload());
        assertThat(payload.get("notificationId").stringValue()).isEqualTo(notificationId.toString());
        assertThat(payload.get("recipientUserId").stringValue()).isEqualTo(recipientUserId.toString());
        assertThat(payload.get("kind").stringValue()).isEqualTo(NotificationKind.ADMIN_MESSAGE.name());
    }

    private static Notification notification() {
        Notification notification = new Notification();
        notification.setId(UUID.randomUUID());
        notification.setKind(NotificationKind.ADMIN_MESSAGE);
        notification.setContent("Scheduled maintenance tonight.");
        notification.setCreatedAt(Instant.parse("2026-10-23T01:00:00Z"));
        return notification;
    }

    private static UserAccount user(UUID userId) {
        UserAccount user = new UserAccount();
        user.setId(userId);
        return user;
    }
}
