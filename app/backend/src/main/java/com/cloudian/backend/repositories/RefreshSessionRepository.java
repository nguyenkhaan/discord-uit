package com.cloudian.backend.repositories;

import com.cloudian.backend.models.RefreshSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface RefreshSessionRepository extends JpaRepository<RefreshSession, UUID> {

    /** Token hash must be SHA-256 hex (see TokenHashUtil.sha256Hex). */
    Optional<RefreshSession> findByTokenHash(String tokenHash);

    /**
     * Revokes every still-active session of a user (logout all devices,
     * password change, account ban). Returns the number of revoked sessions.
     * Must be called inside a transaction.
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
            update RefreshSession s
               set s.revokedAt = :now
             where s.user.id = :userId
               and s.revokedAt is null
            """)
    int revokeAllActiveByUserId(@Param("userId") UUID userId, @Param("now") Instant now);
}
