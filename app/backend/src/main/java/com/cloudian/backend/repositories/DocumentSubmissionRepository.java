package com.cloudian.backend.repositories;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cloudian.backend.models.DocumentSubmission;

public interface DocumentSubmissionRepository extends JpaRepository<DocumentSubmission, UUID> {
}
