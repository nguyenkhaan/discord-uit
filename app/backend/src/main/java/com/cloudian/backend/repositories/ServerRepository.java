package com.cloudian.backend.repositories;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cloudian.backend.models.Server;

public interface ServerRepository
        extends JpaRepository<Server, UUID> {

    Optional<Server> findByIdAndDeletedAtIsNull(UUID serverId);
}