package com.cloudian.backend.repositories;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cloudian.backend.models.AgentClassificationTag;
import com.cloudian.backend.models.ids.AgentClassificationTagId;

public interface AgentClassificationTagRepository
        extends JpaRepository<AgentClassificationTag, AgentClassificationTagId> {

    boolean existsByTag_Id(UUID tagId);
}
