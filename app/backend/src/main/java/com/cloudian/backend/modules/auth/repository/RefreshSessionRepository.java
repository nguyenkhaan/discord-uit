package com.cloudian.backend.modules.auth.repository;


import java.time.Instant;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.cloudian.backend.modules.auth.entity.RefreshSession;


public interface RefreshSessionRepository extends JpaRepository<RefreshSession, UUID> {

    @Modifying
    @Query("update RefreshSession s set s.revokedAt = :now where s.id = :id and s.revokedAt is null")
    int revokeById(@Param("id") UUID id, @Param("now") Instant now);

    @Modifying
    @Query("update RefreshSession s set s.revokedAt = :now where s.userId = :userId and s.revokedAt is null")
    int revokeAllByUserId(@Param("userId") UUID userId, @Param("now") Instant now);
}
