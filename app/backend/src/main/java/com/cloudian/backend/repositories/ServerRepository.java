package com.cloudian.backend.repositories;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.cloudian.backend.models.Server;

import jakarta.persistence.LockModeType;

public interface ServerRepository
        extends JpaRepository<Server, UUID> {

    Optional<Server> findByIdAndDeletedAtIsNull(UUID serverId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Server s WHERE s.id = :serverId AND s.deletedAt IS NULL")
    Optional<Server> findByIdAndDeletedAtIsNullForUpdate(@Param("serverId") UUID serverId);
}
