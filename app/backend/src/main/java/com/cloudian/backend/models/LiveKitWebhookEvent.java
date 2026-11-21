package com.cloudian.backend.models;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "livekit_webhook_event")
@Getter
@Setter
@NoArgsConstructor
public class LiveKitWebhookEvent {

    @Id
    @Column(name = "event_id", nullable = false, updatable = false)
    private String eventId;

    @Column(name = "event_type", nullable = false)
    private String eventType;

    @Column(name = "room_name")
    private String roomName;

    @Column(name = "participant_identity")
    private String participantIdentity;

    @Column(name = "received_at", nullable = false, updatable = false)
    private Instant receivedAt;
}