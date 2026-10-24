package com.cloudian.backend.repositories;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cloudian.backend.commons.enums.ServerMemberRole;
import com.cloudian.backend.models.ServerMembership;

public interface ServerMembershipRepository
        extends JpaRepository<ServerMembership, UUID> {

    Optional<ServerMembership> findByServer_IdAndUser_IdAndLeftAtIsNull(
            UUID serverId,
            UUID userId);

    boolean existsByServer_IdAndUser_IdAndRoleAndLeftAtIsNull(
            UUID serverId,
            UUID userId,
            ServerMemberRole role);
}