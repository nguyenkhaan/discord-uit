package com.cloudian.backend.repositories;

import java.util.UUID;

import org.springdoc.core.converters.models.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.cloudian.backend.models.Notification;
@Repository 
public interface NotificationRepository extends JpaRepository<Notification , UUID> {
    Page<Notification> findByRecipient_IdAndDeletedAtIsNull(UUID userId , Pageable pageable);
}
