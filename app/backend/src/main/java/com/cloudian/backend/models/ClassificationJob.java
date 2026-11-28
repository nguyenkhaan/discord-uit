package com.cloudian.backend.models;

import java.time.Instant;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.cloudian.backend.commons.enums.ClassificationJobStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Durable idempotency and result-publication state owned by the AI worker.
 * It is keyed by the same business run id used by {@link ClassificationRun}.
 */
@Entity
@Table(
        name = "classification_job",
        indexes = @Index(name = "idx_classification_job_status_lease", columnList = "status, lease_until"))
@Getter
@NoArgsConstructor
public class ClassificationJob {

    @Id
    @Column(name = "classification_run_id", nullable = false, updatable = false, length = 128)
    private String classificationRunId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private ClassificationJobStatus status = ClassificationJobStatus.PROCESSING;

    @Column(name = "attempt", nullable = false)
    private int attempt;

    @Column(name = "lease_until")
    private Instant leaseUntil;

    @Column(name = "result_topic", length = 255)
    private String resultTopic;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "result_payload", columnDefinition = "jsonb")
    private String resultPayload;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
