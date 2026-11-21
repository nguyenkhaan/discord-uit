package com.cloudian.backend.models;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

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

@Entity
@Table(name = "tag", uniqueConstraints = @UniqueConstraint(
        name = "uk_tag_slug",
        columnNames = {"slug"}
))
@Getter
@Setter
@NoArgsConstructor
public class Tag {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "slug", nullable = false)
    private String slug;

    @Column(name = "description", nullable = false)
    private String description;

    @OneToMany(mappedBy = "tag", fetch = FetchType.LAZY)
    private Set<DocumentTag> documentTags = new HashSet<>();

    @OneToMany(mappedBy = "tag", fetch = FetchType.LAZY)
    private Set<AgentClassificationTag> agentClassificationTags = new HashSet<>();
}
