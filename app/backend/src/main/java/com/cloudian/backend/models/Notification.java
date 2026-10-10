package com.cloudian.backend.models;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.annotation.CreatedDate;

import com.cloudian.backend.commons.enums.NotificationKind;

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

/** Notifications remain until the recipient deletes them or the account is deleted. */
@Entity
@Table(name = "notification")
@Getter
@Setter
@NoArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipient_user_id", nullable = false, updatable = false)
    private UserAccount recipient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_user_id", updatable = false)
    private UserAccount actor;

    @Enumerated(EnumType.STRING)
    @Column(name = "kind", nullable = false, updatable = false)
    private NotificationKind kind;

    @Column(name = "content", nullable = false, updatable = false)
    private String content;

    @Column(name = "related_entity_type", updatable = false)
    private String relatedEntityType;

    @Column(name = "related_entity_id", updatable = false)
    private UUID relatedEntityId;

    @Column(name = "read_at")
    private Instant readAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
