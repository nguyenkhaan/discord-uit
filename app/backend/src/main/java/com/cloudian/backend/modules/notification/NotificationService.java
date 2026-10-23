package com.cloudian.backend.modules.notification;

import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;

import com.cloudian.backend.modules.notification.dto.NotificationListRequest;
import com.cloudian.backend.modules.notification.dto.NotificationListResponse;
import com.cloudian.backend.repositories.NotificationRepository;

public class NotificationService {
    @Autowired  
    NotificationRepository notificationRepository;
    public List<NotificationListResponse> ListNotification(UUID recipientUserId , NotificationListRequest request) 
    {
        return null; 
    }
}
