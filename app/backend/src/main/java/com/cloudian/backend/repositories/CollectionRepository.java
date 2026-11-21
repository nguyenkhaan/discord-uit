package com.cloudian.backend.repositories;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    @Query(value = """
            select distinct t.slug
            from document_collection dc
            join document_tag dt on dt.document_id = dc.document_id
            join tag t on t.id = dt.tag_id
            where dc.collection_id = :collectionId
            order by t.slug
            """, nativeQuery = true)
    List<String> findTagSlugsByCollectionId(@Param("collectionId") UUID collectionId);
}
