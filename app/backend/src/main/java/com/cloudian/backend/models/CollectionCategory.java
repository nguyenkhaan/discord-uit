package com.cloudian.backend.models;

import java.time.Instant;

import org.springframework.data.annotation.CreatedDate;

import com.cloudian.backend.models.ids.CollectionCategoryId;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "collection_category")
@Getter
@Setter
@NoArgsConstructor
public class CollectionCategory {

    @EmbeddedId
    private CollectionCategoryId id = new CollectionCategoryId();

    @MapsId("collectionId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "collection_id", nullable = false, updatable = false)
    private Collection collection;

    @MapsId("categoryId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false, updatable = false)
    private Category category;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
