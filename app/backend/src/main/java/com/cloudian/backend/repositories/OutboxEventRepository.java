package com.cloudian.backend.repositories;

import java.util.UUID;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import com.cloudian.backend.commons.enums.OutboxStatus;
import com.cloudian.backend.models.OutboxEvent;

import jakarta.persistence.LockModeType;

public interface OutboxEventRepository extends JpaRepository<OutboxEvent, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    List<OutboxEvent> findByEntityTypeAndStatusOrderByCreatedAtAsc(
            String entityType,
            OutboxStatus status);
}
