package com.cloudian.backend.repositories;

import java.util.UUID;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cloudian.backend.commons.enums.OutboxStatus;
import com.cloudian.backend.models.OutboxEvent;

public interface OutboxEventRepository extends JpaRepository<OutboxEvent, UUID> {

    List<OutboxEvent> findByEntityTypeAndStatusOrderByCreatedAtAsc(
            String entityType,
            OutboxStatus status);
}
