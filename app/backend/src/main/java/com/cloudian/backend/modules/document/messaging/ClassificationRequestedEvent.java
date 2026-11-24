package com.cloudian.backend.modules.document.messaging;

import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

public record ClassificationRequestedEvent(
        String schemaVersion,
        UUID eventId,
        String classificationRunId,
        UUID documentId,
        UUID submissionId,
        UUID mediaId,
        FileMetadata file,
        SignedGetUrl signedGetUrl,
        TaxonomySnapshot taxonomy,
        int attempt,
        Instant occurredAt) {

    public ClassificationRequestedEvent {
        schemaVersion = required(schemaVersion, "schemaVersion");
        eventId = Objects.requireNonNull(eventId, "eventId is required.");
        classificationRunId = required(classificationRunId, "classificationRunId");
        documentId = Objects.requireNonNull(documentId, "documentId is required.");
        submissionId = Objects.requireNonNull(submissionId, "submissionId is required.");
        mediaId = Objects.requireNonNull(mediaId, "mediaId is required.");
        file = Objects.requireNonNull(file, "file is required.");
        signedGetUrl = Objects.requireNonNull(signedGetUrl, "signedGetUrl is required.");
        taxonomy = Objects.requireNonNull(taxonomy, "taxonomy is required.");
        if (attempt < 1) {
            throw new IllegalArgumentException("attempt must be positive.");
        }
        occurredAt = Objects.requireNonNull(occurredAt, "occurredAt is required.");
    }

    public record FileMetadata(String fileName, String mimeType, long sizeBytes, String verifiedEtag) {

        public FileMetadata {
            fileName = required(fileName, "fileName");
            mimeType = required(mimeType, "mimeType");
            verifiedEtag = required(verifiedEtag, "verifiedEtag");
            if (sizeBytes <= 0) {
                throw new IllegalArgumentException("sizeBytes must be positive.");
            }
        }
    }

    public record SignedGetUrl(String value, Instant expiresAt) {

        public SignedGetUrl {
            value = required(value, "signed URL");
            expiresAt = Objects.requireNonNull(expiresAt, "expiresAt is required.");
        }
    }

    public record TaxonomySnapshot(
            String version,
            List<String> collectionSlugs,
            List<String> tagSlugs) {

        public TaxonomySnapshot {
            version = required(version, "taxonomy version");
            collectionSlugs = List.copyOf(Objects.requireNonNull(collectionSlugs, "collectionSlugs is required."));
            tagSlugs = List.copyOf(Objects.requireNonNull(tagSlugs, "tagSlugs is required."));
        }
    }

    private static String required(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(fieldName + " is required.");
        }
        return value;
    }
}
