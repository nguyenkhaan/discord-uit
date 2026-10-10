package com.cloudian.backend.models;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.annotation.CreatedDate;

import com.cloudian.backend.commons.enums.AccountTokenPurpose;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "account_token")
@Getter
@Setter
@NoArgsConstructor
public class AccountToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private UserAccount user;

    @Column(name = "token_hash", nullable = false, unique = true, updatable = false)
    private String tokenHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "purpose", nullable = false, updatable = false)
    private AccountTokenPurpose purpose;

    @Column(name = "expires_at", nullable = false, updatable = false)
    private Instant expiresAt;

    @Column(name = "consumed_at")
    private Instant consumedAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
