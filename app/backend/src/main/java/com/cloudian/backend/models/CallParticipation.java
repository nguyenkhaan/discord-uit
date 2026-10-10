package com.cloudian.backend.models;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Only one participation per (call_session, user) may have left_at = null,
 * and at most 30 participation rows may be active per call.
 */
@Entity
@Table(name = "call_participation", uniqueConstraints = @UniqueConstraint(
        name = "uk_call_participation_session_user_joined",
        columnNames = {"call_session_id", "user_id", "joined_at"}))
@Getter
@Setter
@NoArgsConstructor
public class CallParticipation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "call_session_id", nullable = false, updatable = false)
    private CallSession callSession;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private UserAccount user;

    @Column(name = "joined_at", nullable = false, updatable = false)
    private Instant joinedAt;

    @Column(name = "left_at")
    private Instant leftAt;
}
