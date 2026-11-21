package com.cloudian.backend.repositories;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cloudian.backend.models.DocumentTag;

public interface DocumentTagRepository extends JpaRepository<DocumentTag, UUID> {

    boolean existsByTag_Id(UUID tagId);
}
