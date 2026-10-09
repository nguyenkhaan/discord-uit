package com.cloudian.backend.models;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.annotation.CreatedDate;

import com.cloudian.backend.commons.enums.ServerInviteStatus;
import com.cloudian.backend.commons.enums.ServerInviteType;

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

/**
 * DIRECT invites require recipient; LINK invites require token_hash, positive max_uses
 * and use_count <= max_uses.
 */
@Entity
@Table(name = "server_invite")
@Getter
@Setter
@NoArgsConstructor
public class ServerInvite {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "server_id", nullable = false, updatable = false)
    private Server server;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_user_id", nullable = false, updatable = false)
    private UserAccount createdBy;

    /** Required for DIRECT invites and null for LINK invites. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_user_id", updatable = false)
    private UserAccount recipient;

    /** Required for LINK invites; DIRECT invites may omit it. */
    @Column(name = "token_hash", unique = true, updatable = false)
    private String tokenHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "invite_type", nullable = false, updatable = false)
    private ServerInviteType inviteType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ServerInviteStatus status = ServerInviteStatus.PENDING;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "max_uses")
    private Integer maxUses;

    @Column(name = "use_count", nullable = false)
    private int useCount = 0;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "accepted_at")
    private Instant acceptedAt;

    @Column(name = "declined_at")
    private Instant declinedAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;
}
