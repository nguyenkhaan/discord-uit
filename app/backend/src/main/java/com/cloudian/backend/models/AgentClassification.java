package com.cloudian.backend.models;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.annotation.CreatedDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Classifications belong to a submission because OCR and suggestions may change on resubmission.
 * AI/OCR output is untrusted recommendation data.
 */
@Entity
@Table(name = "agent_classification")
@Getter
@Setter
@NoArgsConstructor
public class AgentClassification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "document_submission_id", nullable = false, updatable = false)
    private DocumentSubmission documentSubmission;

    @Column(name = "model_id", nullable = false, updatable = false)
    private String modelId;

    @Column(name = "classification_run_id", nullable = false, unique = true, updatable = false)
    private String classificationRunId;

    @Column(name = "ocr_text", updatable = false)
    private String ocrText;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
