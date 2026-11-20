package com.cloudian.backend.models;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * An administrator-curated grouping of documents.
 * Note: the class name shadows java.util.Collection inside this package; import explicitly if both are needed.
 */
@Entity
@Table(name = "collection", uniqueConstraints = @UniqueConstraint(
        name = "uk_slug_collection",
        columnNames = {"slug"}
))
@Getter
@Setter
@NoArgsConstructor
public class Collection {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "name", nullable = false, unique = true)
    private String name;

    @Column(name = "description")
    private String description;

    @Column(name = "slug", nullable = false, unique = true)
    private String slug;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "keywords", columnDefinition = "text[]", nullable = false)
    private List<String> keywords = new ArrayList<>();

    @OneToMany(mappedBy = "collection", fetch = FetchType.LAZY)
    private Set<DocumentCollection> documentCollections = new HashSet<>();

    @OneToMany(mappedBy = "collection", fetch = FetchType.LAZY)
    private Set<AgentClassificationCollection> agentClassificationCollections = new HashSet<>();
}
