package com.cloudian.backend.models;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

import com.cloudian.backend.commons.enums.ClassificationRunStatus;
import com.cloudian.backend.commons.enums.DocumentSubmissionStatus;
import com.cloudian.backend.commons.enums.MediaStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "classification_run",
        indexes = {
                @Index(name = "idx_classification_run_submission", columnList = "document_submission_id"),
                @Index(name = "idx_classification_run_media", columnList = "media_id"),
                @Index(name = "idx_classification_run_status", columnList = "status")
        })
@Getter
@NoArgsConstructor
public class ClassificationRun {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "classification_run_id", nullable = false, unique = true, updatable = false, length = 128)
    private String classificationRunId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "document_submission_id", nullable = false, updatable = false)
    private DocumentSubmission documentSubmission;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "media_id", nullable = false, updatable = false)
    private Media media;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private ClassificationRunStatus status = ClassificationRunStatus.QUEUED;

    @Column(name = "attempt_count", nullable = false)
    private int attemptCount;

    @Column(name = "failure_code", length = 128)
    private String failureCode;

    @Column(name = "failure_message")
    private String failureMessage;

    @Column(name = "model_id", length = 255)
    private String modelId;

    @Column(name = "ocr_needed", nullable = false)
    private boolean ocrNeeded;

    @Column(name = "queued_at", nullable = false, updatable = false)
    private Instant queuedAt;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public static ClassificationRun queued(
            String classificationRunId,
            DocumentSubmission submission,
            Media media,
            Instant queuedAt) {
        if (classificationRunId == null || classificationRunId.isBlank()) {
            throw new IllegalArgumentException("classificationRunId is required.");
        }
        if (submission == null || submission.getDocument() == null || submission.getDocument().getMedia() == null) {
            throw new IllegalArgumentException("A submission with a media record is required.");
        }
        if (submission.getStatus() != DocumentSubmissionStatus.PENDING_PROCESSING) {
            throw new IllegalStateException("Only PENDING_PROCESSING submissions can be queued.");
        }
        if (media == null || media.getStatus() != MediaStatus.READY) {
            throw new IllegalStateException("Only READY media can be queued.");
        }
        if (!sameEntity(submission.getDocument().getMedia(), media)) {
            throw new IllegalArgumentException("The submission and run media must match.");
        }
        Objects.requireNonNull(queuedAt, "queuedAt is required.");

        ClassificationRun run = new ClassificationRun();
        run.classificationRunId = classificationRunId;
        run.documentSubmission = submission;
        run.media = media;
        run.status = ClassificationRunStatus.QUEUED;
        run.queuedAt = queuedAt;
        run.createdAt = queuedAt;
        run.updatedAt = queuedAt;
        return run;
    }

    public void transitionTo(ClassificationRunStatus nextStatus, Instant changedAt) {
        Objects.requireNonNull(nextStatus, "nextStatus is required.");
        Objects.requireNonNull(changedAt, "changedAt is required.");
        if (status != nextStatus && !isAllowedTransition(status, nextStatus)) {
            throw new IllegalStateException(
                    "Cannot transition classification run from " + status + " to " + nextStatus + ".");
        }
        status = nextStatus;
        updatedAt = changedAt;
        if (nextStatus == ClassificationRunStatus.RUNNING && startedAt == null) {
            startedAt = changedAt;
        }
        if (nextStatus == ClassificationRunStatus.SUCCEEDED
                || nextStatus == ClassificationRunStatus.FAILED
                || nextStatus == ClassificationRunStatus.DEAD_LETTER) {
            completedAt = changedAt;
        }
        if (nextStatus == ClassificationRunStatus.QUEUED) {
            completedAt = null;
            startedAt = null;
        }
    }

    public int incrementAttempt() {
        attemptCount += 1;
        return attemptCount;
    }

    public void setFailure(String failureCode, String failureMessage) {
        this.failureCode = failureCode;
        this.failureMessage = failureMessage;
    }

    public void setModelId(String modelId) {
        this.modelId = modelId;
    }

    public void setOcrNeeded(boolean ocrNeeded) {
        this.ocrNeeded = ocrNeeded;
    }

    private static boolean sameEntity(Media first, Media second) {
        return first == second || (first.getId() != null && first.getId().equals(second.getId()));
    }

    private static boolean isAllowedTransition(
            ClassificationRunStatus current,
            ClassificationRunStatus next) {
        return switch (current) {
            case QUEUED -> next == ClassificationRunStatus.RUNNING
                    || next == ClassificationRunStatus.FAILED
                    || next == ClassificationRunStatus.DEAD_LETTER;
            case RUNNING -> next == ClassificationRunStatus.SUCCEEDED
                    || next == ClassificationRunStatus.FAILED
                    || next == ClassificationRunStatus.DEAD_LETTER;
            case FAILED -> next == ClassificationRunStatus.QUEUED
                    || next == ClassificationRunStatus.DEAD_LETTER;
            case SUCCEEDED, DEAD_LETTER -> false;
        };
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (queuedAt == null) queuedAt = now;
        if (createdAt == null) createdAt = queuedAt;
        if (updatedAt == null) updatedAt = queuedAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
