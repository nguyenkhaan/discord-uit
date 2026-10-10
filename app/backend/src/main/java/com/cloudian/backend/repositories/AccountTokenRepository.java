package com.cloudian.backend.repositories;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cloudian.backend.commons.enums.AccountTokenPurpose;
import com.cloudian.backend.models.AccountToken;

public interface AccountTokenRepository extends JpaRepository<AccountToken, UUID> {

    Optional<AccountToken> findByTokenHashAndPurpose(String tokenHash, AccountTokenPurpose purpose);
}
