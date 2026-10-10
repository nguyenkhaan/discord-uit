package com.cloudian.backend.models;

import java.time.Instant;
import java.util.UUID;

import com.cloudian.backend.commons.enums.MembershipEndReason;
import com.cloudian.backend.commons.enums.ServerMemberRole;

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
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A new row is created whenever a user rejoins after leaving or being removed.
 * Only one membership per (server, user) may have left_at = null (enforce with a partial index in SQL).
 */
@Entity
@Table(name = "server_membership", uniqueConstraints = @UniqueConstraint(
        name = "uk_server_membership_server_user_joined",
        columnNames = {"server_id", "user_id", "joined_at"}))
@Getter
@Setter
@NoArgsConstructor
public class ServerMembership {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private UserAccount user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "server_id", nullable = false, updatable = false)
    private Server server;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private ServerMemberRole role = ServerMemberRole.MEMBER;

    @Column(name = "joined_at", nullable = false, updatable = false)
    private Instant joinedAt;

    @Column(name = "left_at")
    private Instant leftAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "ended_reason")
    private MembershipEndReason endedReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ended_by_user_id")
    private UserAccount endedBy;
}
