
package com.cloudian.backend.repositories;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cloudian.backend.commons.enums.CallStatus;
import com.cloudian.backend.models.CallSession;

public interface CallSessionRepository
                extends JpaRepository<CallSession, UUID> {

        Optional<CallSession> findByServer_IdAndStatus(
                        UUID serverId,
                        CallStatus status);

        boolean existsByServer_IdAndStatus(
                        UUID serverId,
                        CallStatus status);

        Optional<CallSession> findByLivekitRoomName(String roomName);

        Optional<CallSession> findByLivekitRoomNameAndStatus(
                        String roomName,
                        CallStatus status);
}
