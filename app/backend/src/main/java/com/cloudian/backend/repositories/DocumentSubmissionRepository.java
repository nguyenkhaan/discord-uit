package com.cloudian.backend.repositories;

import java.util.UUID;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cloudian.backend.models.DocumentSubmission;
import com.cloudian.backend.commons.enums.DocumentSubmissionStatus;

public interface DocumentSubmissionRepository extends JpaRepository<DocumentSubmission, UUID> {

    List<DocumentSubmission> findBySubmittedBy_IdOrderBySubmittedAtDesc(UUID userId);

    List<DocumentSubmission> findByStatusOrderBySubmittedAtDesc(DocumentSubmissionStatus status);

    List<DocumentSubmission> findAllByOrderBySubmittedAtDesc();
}
