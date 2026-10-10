package com.cloudian.backend.models;

import java.time.Instant;

import org.springframework.data.annotation.CreatedDate;

import com.cloudian.backend.models.ids.DocumentCollectionId;

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
@Table(name = "document_collection")
@Getter
@Setter
@NoArgsConstructor
public class DocumentCollection {

    @EmbeddedId
    private DocumentCollectionId id = new DocumentCollectionId();

    @MapsId("documentId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "document_id", nullable = false, updatable = false)
    private Document document;

    @MapsId("collectionId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "collection_id", nullable = false, updatable = false)
    private Collection collection;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
