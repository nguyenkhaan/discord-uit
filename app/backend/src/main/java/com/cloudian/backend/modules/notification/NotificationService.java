package com.cloudian.backend.modules.notification;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cloudian.backend.commons.enums.NotificationKind;
import com.cloudian.backend.exceptions.ApiException;
import com.cloudian.backend.models.Notification;
import com.cloudian.backend.models.OutboxEvent;
import com.cloudian.backend.models.UserAccount;
import com.cloudian.backend.modules.notification.dto.NotificationListRequest;
import com.cloudian.backend.modules.notification.dto.NotificationListResponse;
import com.cloudian.backend.modules.notification.dto.NotificationResponse;
import com.cloudian.backend.modules.notification.dto.SendAdminMessageRequest;
import com.cloudian.backend.modules.notification.dto.UnreadNotificationCountResponse;
import com.cloudian.backend.modules.notification.messaging.NotificationCreatedEvent;
import com.cloudian.backend.repositories.NotificationRepository;
import com.cloudian.backend.repositories.OutboxEventRepository;
import com.cloudian.backend.repositories.UserAccountRepository;

import lombok.RequiredArgsConstructor;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final String NOTIFICATION_ENTITY_TYPE = "NOTIFICATION";
    private static final String NOTIFICATION_CREATED_EVENT_TYPE = "NOTIFICATION_CREATED";

    private final NotificationRepository notificationRepository;
    private final UserAccountRepository userAccountRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final JsonMapper jsonMapper;

    @Transactional(readOnly = true)
    public NotificationListResponse listNotifications(
            UUID recipientUserId,
            NotificationListRequest request
    ) {
        Pageable pageable = PageRequest.of(
                request.page(),
                request.size(),
                Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"))
        );

        Page<Notification> notificationPage = notificationRepository
                .findByRecipient_IdAndDeletedAtIsNull(recipientUserId, pageable);

        return new NotificationListResponse(
                notificationPage.map(NotificationResponse::from).getContent(),
                notificationPage.getNumber(),
                notificationPage.getSize(),
                notificationPage.getTotalElements(),
                notificationPage.getTotalPages());
    }

    @Transactional(readOnly = true)
    public NotificationResponse getNotification(UUID recipientUserId, UUID notificationId) {
        return NotificationResponse.from(findVisibleNotification(recipientUserId, notificationId));
    }

    @Transactional(readOnly = true)
    public UnreadNotificationCountResponse getUnreadCount(UUID recipientUserId) {
        long unreadCount = notificationRepository
                .countByRecipient_IdAndReadAtIsNullAndDeletedAtIsNull(recipientUserId);
        return new UnreadNotificationCountResponse(unreadCount);
    }

    @Transactional
    public void markAsRead(UUID recipientUserId, UUID notificationId) {
        Notification notification = findVisibleNotification(recipientUserId, notificationId);
        if (notification.getReadAt() != null) {
            return;
        }

        notification.setReadAt(Instant.now());
        notificationRepository.save(notification);
    }

    @Transactional
    public void deleteNotification(UUID recipientUserId, UUID notificationId) {
        Notification notification = findVisibleNotification(recipientUserId, notificationId);
        notification.setDeletedAt(Instant.now());
        notificationRepository.save(notification);
    }

    @Transactional
    public NotificationResponse sendAdminMessage(UUID adminUserId, SendAdminMessageRequest request) {
        UserAccount admin = userAccountRepository.findById(adminUserId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Authentication is required."));
        UserAccount recipient = userAccountRepository.findById(request.recipientUserId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Recipient not found."));

        Notification notification = new Notification();
        notification.setActor(admin);
        notification.setRecipient(recipient);
        notification.setKind(NotificationKind.ADMIN_MESSAGE);
        notification.setContent(request.content());

        Notification savedNotification = notificationRepository.save(notification);
        outboxEventRepository.save(toOutboxEvent(savedNotification));
        return NotificationResponse.from(savedNotification);
    }

    private Notification findVisibleNotification(UUID recipientUserId, UUID notificationId) {
        return notificationRepository
                .findByIdAndRecipient_IdAndDeletedAtIsNull(notificationId, recipientUserId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Notification not found."));
    }

    private OutboxEvent toOutboxEvent(Notification notification) {
        OutboxEvent event = new OutboxEvent();
        event.setEntityType(NOTIFICATION_ENTITY_TYPE);
        event.setEntityId(notification.getId());
        event.setEventType(NOTIFICATION_CREATED_EVENT_TYPE);
        event.setPayload(serialize(NotificationCreatedEvent.from(notification)));
        return event;
    }

    private String serialize(NotificationCreatedEvent event) {
        try {
            return jsonMapper.writeValueAsString(event);
        } catch (JacksonException exception) {
            throw new IllegalStateException("Could not serialize notification outbox event.", exception);
        }
    }
}
