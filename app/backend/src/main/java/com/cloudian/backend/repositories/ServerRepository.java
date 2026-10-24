package com.cloudian.backend.repositories;

import com.cloudian.backend.models.Server;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ServerRepository extends JpaRepository<Server, UUID> {
}
