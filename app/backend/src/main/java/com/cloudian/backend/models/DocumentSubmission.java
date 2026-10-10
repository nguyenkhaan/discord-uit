package com.cloudian.backend.models;

import java.time.Instant;
import java.util.UUID;

import com.cloudian.backend.commons.enums.DocumentSubmissionStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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

/** Review attempts are append-only so a rejected document can be submitted again. */
@Entity
@Table(name = "document_submission")
@Getter
@Setter
@NoArgsConstructor
public class DocumentSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "document_id", nullable = false, updatable = false)
    private Document document;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "submitted_by_user_id", nullable = false, updatable = false)
    private UserAccount submittedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private DocumentSubmissionStatus status = DocumentSubmissionStatus.PENDING_PROCESSING;

    @Column(name = "submitted_at", nullable = false, updatable = false)
    private Instant submittedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by_user_id")
    private UserAccount reviewedBy;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "rejection_reason")
    private String rejectionReason;

    @Column(name = "purge_at")
    private Instant purgeAt;
}
