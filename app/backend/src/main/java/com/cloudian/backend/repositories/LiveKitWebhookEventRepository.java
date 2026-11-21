package com.cloudian.backend.repositories;

import java.time.Instant;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.cloudian.backend.models.LiveKitWebhookEvent;

public interface LiveKitWebhookEventRepository
        extends JpaRepository<LiveKitWebhookEvent, String> {

    @Modifying
    @Query(value = """
            INSERT INTO public.livekit_webhook_event (
                event_id,
                event_type,
                room_name,
                participant_identity,
                received_at
            )
            VALUES (
                :eventId,
                :eventType,
                :roomName,
                :participantIdentity,
                :receivedAt
            )
            ON CONFLICT (event_id) DO NOTHING
            """, nativeQuery = true)
    int insertIfAbsent(
            @Param("eventId") String eventId,
            @Param("eventType") String eventType,
            @Param("roomName") String roomName,
            @Param("participantIdentity") String participantIdentity,
            @Param("receivedAt") Instant receivedAt);
}