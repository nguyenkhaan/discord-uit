package com.cloudian.backend.repositories;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cloudian.backend.models.DocumentCollection;
import com.cloudian.backend.models.ids.DocumentCollectionId;

public interface DocumentCollectionRepository extends JpaRepository<DocumentCollection, DocumentCollectionId> {

    boolean existsByCollection_Id(UUID collectionId);
}
