package com.cloudian.backend.repositories;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.cloudian.backend.modules.server.ServerMemberCount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cloudian.backend.commons.enums.ServerMemberRole;
import com.cloudian.backend.models.ServerMembership;

public interface ServerMembershipRepository extends JpaRepository<ServerMembership, UUID> {

    // Find role of active user
    @Query("""
        select m.role
          from ServerMembership m
         where m.server.id = :serverId
           and m.user.id = :userId
           and m.leftAt is null
           and m.server.deletedAt is null
        """)
    Optional<ServerMemberRole> findActiveRole(@Param("serverId") UUID serverId,
                                              @Param("userId") UUID userId);


    // Find servers that a member is currently in
    @Query("""
    select m
      from ServerMembership m
      join fetch m.server s
     where m.user.id = :userId
       and m.leftAt is null
       and s.deletedAt is null
     order by m.joinedAt desc
    """)
    List<ServerMembership> findActiveByUserId(@Param("userId") UUID userId);

    // Find members of a server
    @Query("""
    select m
      from ServerMembership m
      join fetch m.user
     where m.server.id = :serverId
       and m.leftAt is null
     order by m.joinedAt asc
    """)
    List<ServerMembership> findActiveByServerId(@Param("serverId") UUID serverId);

    // Find total number of members by each server (use for listing server)
    @Query("""
    select new com.cloudian.backend.modules.server.ServerMemberCount(m.server.id, count(m))
      from ServerMembership m
     where m.server.id in :serverIds
       and m.leftAt is null
     group by m.server.id
    """)
    List<ServerMemberCount> countActiveByServerIds(@Param("serverIds") Collection<UUID> serverIds);

    // Total Number of member in one server
    long countByServerIdAndLeftAtIsNull(UUID serverId);

    Optional<ServerMembership> findByServer_IdAndUser_IdAndLeftAtIsNull(
            UUID serverId,
            UUID userId);

    boolean existsByServer_IdAndUser_IdAndRoleAndLeftAtIsNull(
            UUID serverId,
            UUID userId,
            ServerMemberRole role);
}