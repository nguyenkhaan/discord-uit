package com.cloudian.backend.repositories;

import java.util.UUID;

import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

import com.cloudian.backend.models.Document;

public interface DocumentRepository extends JpaRepository<Document, UUID> {

    boolean existsBySlug(String slug);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select document from Document document where document.id = :documentId")
    java.util.Optional<Document> findByIdForUpdate(@Param("documentId") UUID documentId);
}
