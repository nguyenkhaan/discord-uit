
package com.cloudian.backend.repositories;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import com.cloudian.backend.models.CallParticipation;

public interface CallParticipationRepository
                extends JpaRepository<CallParticipation, UUID> {

        // Find an active participation of a user in a call
        Optional<CallParticipation> findByCallSession_IdAndUser_IdAndLeftAtIsNull(
                        UUID callSessionId,
                        UUID userId);

        // Count current active participants in a call
        long countByCallSession_IdAndLeftAtIsNull(UUID callSessionId);

        // Get all current active participants in a call
        List<CallParticipation> findAllByCallSession_IdAndLeftAtIsNullOrderByJoinedAtAsc(
                        UUID callSessionId);

        // Get participation history of a call
        List<CallParticipation> findAllByCallSession_IdOrderByJoinedAtAsc(
                        UUID callSessionId);

        boolean existsByCallSession_IdAndUser_Id(
                        UUID callSessionId,
                        UUID userId);

        Optional<CallParticipation> findByCallSession_IdAndUser_IdAndJoinedAt(
                        UUID callSessionId,
                        UUID userId,
                        Instant joinedAt);
}
