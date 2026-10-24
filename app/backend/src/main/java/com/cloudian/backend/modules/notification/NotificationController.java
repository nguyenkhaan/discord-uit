package com.cloudian.backend.modules.notification;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.cloudian.backend.modules.notification.dto.NotificationListRequest;
import com.cloudian.backend.modules.notification.dto.NotificationListResponse;
import com.cloudian.backend.modules.notification.dto.NotificationResponse;
import com.cloudian.backend.modules.notification.dto.UnreadNotificationCountResponse;
import com.cloudian.backend.security.CustomUserDetails;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/notifications")
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public NotificationListResponse listNotifications(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @ModelAttribute NotificationListRequest request
    ) {
        return notificationService.listNotifications(principal.getUserId(), request);
    }

    @GetMapping("/unread-count")
    public UnreadNotificationCountResponse getUnreadCount(
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return notificationService.getUnreadCount(principal.getUserId());
    }

    @GetMapping("/{notificationId}")
    public NotificationResponse getNotification(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID notificationId
    ) {
        return notificationService.getNotification(principal.getUserId(), notificationId);
    }

    @PatchMapping("/{notificationId}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markAsRead(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID notificationId
    ) {
        notificationService.markAsRead(principal.getUserId(), notificationId);
    }

    @DeleteMapping("/{notificationId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteNotification(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID notificationId
    ) {
        notificationService.deleteNotification(principal.getUserId(), notificationId);
    }
}
