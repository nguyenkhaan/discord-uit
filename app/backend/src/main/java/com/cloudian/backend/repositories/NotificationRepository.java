package com.cloudian.backend.repositories;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.cloudian.backend.models.Notification;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    Page<Notification> findByRecipient_IdAndDeletedAtIsNull(UUID recipientUserId, Pageable pageable);

    Optional<Notification> findByIdAndRecipient_IdAndDeletedAtIsNull(UUID notificationId, UUID recipientUserId);

    long countByRecipient_IdAndReadAtIsNullAndDeletedAtIsNull(UUID recipientUserId);
}
