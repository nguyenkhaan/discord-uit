package com.cloudian.backend.repositories;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.cloudian.backend.models.ClassificationRun;

import jakarta.persistence.LockModeType;

public interface ClassificationRunRepository extends JpaRepository<ClassificationRun, UUID> {

    Optional<ClassificationRun> findByClassificationRunId(String classificationRunId);

    Optional<ClassificationRun> findByDocumentSubmission_Id(UUID submissionId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select run
            from ClassificationRun run
            where run.documentSubmission.id = :submissionId
            """)
    Optional<ClassificationRun> findByDocumentSubmission_IdForUpdate(
            @Param("submissionId") UUID submissionId);

    boolean existsByClassificationRunId(String classificationRunId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select run
            from ClassificationRun run
            where run.classificationRunId = :classificationRunId
            """)
    Optional<ClassificationRun> findByClassificationRunIdForUpdate(
            @Param("classificationRunId") String classificationRunId);
}
