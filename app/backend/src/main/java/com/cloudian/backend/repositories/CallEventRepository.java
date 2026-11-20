
package com.cloudian.backend.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cloudian.backend.models.CallEvent;

public interface CallEventRepository
        extends JpaRepository<CallEvent, UUID> {

    // Get all events of a call, ordered by creation time
    List<CallEvent> findAllByCallSession_IdOrderByCreatedAtAsc(
            UUID callSessionId);
}
