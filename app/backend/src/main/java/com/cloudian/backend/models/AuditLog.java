package com.cloudian.backend.models;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.Immutable;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

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
 * Sensitive administrator reads and moderation actions; append-only, retained for at most one year.
 */
@Entity
@Immutable
@Table(name = "audit_log")
@Getter
@Setter
@NoArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "actor_admin_id", nullable = false, updatable = false)
    private UserAccount actorAdmin;

    @Column(name = "action", nullable = false, updatable = false)
    private String action;

    @Column(name = "target_type", updatable = false)
    private String targetType;

    @Column(name = "target_id", updatable = false)
    private UUID targetId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "report_id", updatable = false)
    private Report report;

    @Column(name = "purpose", updatable = false)
    private String purpose;

    @Column(name = "occurred_at", nullable = false, updatable = false)
    private Instant occurredAt;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", updatable = false, columnDefinition = "json")
    private String metadata;

    @Column(name = "retain_until", nullable = false, updatable = false)
    private Instant retainUntil;
}
