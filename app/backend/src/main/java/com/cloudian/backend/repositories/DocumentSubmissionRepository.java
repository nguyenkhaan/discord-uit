package com.cloudian.backend.repositories;

import java.util.UUID;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.cloudian.backend.models.DocumentSubmission;
import com.cloudian.backend.commons.enums.DocumentSubmissionStatus;
import jakarta.persistence.LockModeType;

public interface DocumentSubmissionRepository extends JpaRepository<DocumentSubmission, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select submission from DocumentSubmission submission where submission.id = :id")
    Optional<DocumentSubmission> findByIdForUpdate(@Param("id") UUID id);

    List<DocumentSubmission> findBySubmittedBy_IdOrderBySubmittedAtDesc(UUID userId);

    List<DocumentSubmission> findByStatusOrderBySubmittedAtDesc(DocumentSubmissionStatus status);

    List<DocumentSubmission> findAllByOrderBySubmittedAtDesc();
}
