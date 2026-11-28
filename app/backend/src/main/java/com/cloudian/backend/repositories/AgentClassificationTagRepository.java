package com.cloudian.backend.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cloudian.backend.models.AgentClassificationTag;
import com.cloudian.backend.models.ids.AgentClassificationTagId;

public interface AgentClassificationTagRepository
        extends JpaRepository<AgentClassificationTag, AgentClassificationTagId> {

    List<AgentClassificationTag> findAllByAgentClassification_Id(UUID agentClassificationId);

    boolean existsByTag_Id(UUID tagId);

    long countByTag_Id(UUID tagId);
}
