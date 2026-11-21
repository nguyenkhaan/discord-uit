package com.cloudian.backend.repositories;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cloudian.backend.models.AgentClassificationCollection;
import com.cloudian.backend.models.ids.AgentClassificationCollectionId;

public interface AgentClassificationCollectionRepository
        extends JpaRepository<AgentClassificationCollection, AgentClassificationCollectionId> {

    boolean existsByCollection_Id(UUID collectionId);
}
