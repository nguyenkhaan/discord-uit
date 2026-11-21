package com.cloudian.backend.repositories;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cloudian.backend.models.Document;

public interface DocumentRepository extends JpaRepository<Document, UUID> {

    boolean existsBySlug(String slug);
}
