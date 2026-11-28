package com.cloudian.backend.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cloudian.backend.models.AgentClassificationCollection;
import com.cloudian.backend.models.ids.AgentClassificationCollectionId;

public interface AgentClassificationCollectionRepository
        extends JpaRepository<AgentClassificationCollection, AgentClassificationCollectionId> {

    List<AgentClassificationCollection> findAllByAgentClassification_Id(UUID agentClassificationId);

    boolean existsByCollection_Id(UUID collectionId);

    long countByCollection_Id(UUID collectionId);
}
