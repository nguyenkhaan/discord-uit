package com.cloudian.backend.repositories;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.cloudian.backend.models.Collection;

public interface CollectionRepository extends JpaRepository<Collection, UUID> {

    Page<Collection> findByNameContainingIgnoreCaseOrSlugContainingIgnoreCase(
            String name,
            String slug,
            Pageable pageable);

    Optional<Collection> findBySlug(String slug);

    boolean existsByNameIgnoreCase(String name);

    boolean existsBySlug(String slug);

    boolean existsByNameIgnoreCaseAndIdNot(String name, UUID id);

    boolean existsBySlugAndIdNot(String slug, UUID id);
}
