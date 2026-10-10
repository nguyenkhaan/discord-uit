package com.cloudian.backend.repositories;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cloudian.backend.models.UserAccount;

public interface UserAccountRepository extends JpaRepository<UserAccount, UUID> {

    /** Email must already be normalized (see EmailUtil.normalize). */
    Optional<UserAccount> findByEmail(String email);

    /** Email must already be normalized (see EmailUtil.normalize). */
    boolean existsByEmail(String email);
}
