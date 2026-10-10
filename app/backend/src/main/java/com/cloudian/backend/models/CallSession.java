package com.cloudian.backend.models;

import java.time.Instant;
import java.util.UUID;

import com.cloudian.backend.commons.enums.CallStatus;

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

/** Only one call_session per server may have status = ACTIVE (enforce with a partial index in SQL). */
@Entity
@Table(name = "call_session")
@Getter
@Setter
@NoArgsConstructor
public class CallSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "server_id", nullable = false, updatable = false)
    private Server server;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "coordinator_user_id", nullable = false)
    private UserAccount coordinator;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private CallStatus status = CallStatus.ACTIVE;

    @Column(name = "livekit_room_name", nullable = false, unique = true, updatable = false)
    private String livekitRoomName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "active_screen_sharer_user_id")
    private UserAccount activeScreenSharer;

    @Column(name = "started_at", nullable = false, updatable = false)
    private Instant startedAt;

    @Column(name = "ended_at")
    private Instant endedAt;
}
