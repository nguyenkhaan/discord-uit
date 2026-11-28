package com.cloudian.backend.repositories;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cloudian.backend.models.AgentClassification;

public interface AgentClassificationRepository extends JpaRepository<AgentClassification, UUID> {

    Optional<AgentClassification> findByClassificationRunId(String classificationRunId);
}
