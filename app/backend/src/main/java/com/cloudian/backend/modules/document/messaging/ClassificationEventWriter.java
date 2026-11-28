package com.cloudian.backend.modules.document.messaging;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.cloudian.backend.commons.enums.ClassificationRunStatus;
import com.cloudian.backend.commons.enums.DocumentSubmissionStatus;
import com.cloudian.backend.commons.enums.MediaStatus;
import com.cloudian.backend.commons.enums.OutboxStatus;
import com.cloudian.backend.exceptions.ApiException;
import com.cloudian.backend.models.ClassificationRun;
import com.cloudian.backend.models.Collection;
import com.cloudian.backend.models.DocumentSubmission;
import com.cloudian.backend.models.Media;
import com.cloudian.backend.models.OutboxEvent;
import com.cloudian.backend.models.Tag;
import com.cloudian.backend.repositories.ClassificationRunRepository;
import com.cloudian.backend.repositories.CollectionRepository;
import com.cloudian.backend.repositories.OutboxEventRepository;
import com.cloudian.backend.repositories.TagRepository;
import com.cloudian.backend.services.StorageService;

import lombok.RequiredArgsConstructor;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

/** Coordinates the classification run and outbox write inside the upload transaction. */
@Component
@RequiredArgsConstructor
public class ClassificationEventWriter {

    private static final int MAX_CLASSIFICATION_ATTEMPTS = 20;

    private static final String ENTITY_TYPE = "DOCUMENT_CLASSIFICATION";
    private static final String EVENT_TYPE = "DOCUMENT_CLASSIFICATION_REQUESTED_V1";

    private final ClassificationRunRepository classificationRunRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final CollectionRepository collectionRepository;
    private final TagRepository tagRepository;
    private final StorageService storageService;
    private final JsonMapper jsonMapper;

    @Transactional
    public ClassificationRun enqueue(DocumentSubmission submission) {
        if (submission == null || submission.getId() == null) {
            throw new IllegalArgumentException("A persisted submission is required.");
        }

        return classificationRunRepository.findByDocumentSubmission_Id(submission.getId())
                .orElseGet(() -> createRunAndOutbox(submission));
    }

    @Transactional
    public ClassificationRun retry(UUID submissionId) {
        ClassificationRun run = classificationRunRepository
                .findByDocumentSubmission_IdForUpdate(submissionId)
                .orElseThrow(() -> new ApiException(HttpStatus.CONFLICT, "Classification has not been queued."));
        DocumentSubmission submission = run.getDocumentSubmission();
        Media media = run.getMedia();

        if (run.getStatus() == ClassificationRunStatus.QUEUED
                || run.getStatus() == ClassificationRunStatus.RUNNING) {
            return run;
        }
        if (run.getStatus() != ClassificationRunStatus.FAILED
                && run.getStatus() != ClassificationRunStatus.DEAD_LETTER) {
            throw new ApiException(HttpStatus.CONFLICT, "Only a failed classification can be retried.");
        }
        if (submission.getStatus() != DocumentSubmissionStatus.PENDING_PROCESSING
                || media.getStatus() != MediaStatus.READY) {
            throw new ApiException(HttpStatus.CONFLICT, "The document is not ready for classification retry.");
        }
        if (run.getAttemptCount() >= MAX_CLASSIFICATION_ATTEMPTS) {
            throw new ApiException(HttpStatus.CONFLICT, "The classification retry limit has been reached.");
        }

        Instant now = Instant.now();
        run.transitionTo(ClassificationRunStatus.QUEUED, now);
        int attempt = run.incrementAttempt();
        run.setFailure(null, null);
        run.setModelId(null);
        run.setOcrNeeded(false);
        classificationRunRepository.save(run);
        writeRequestedEvent(run, submission, now, attempt);
        return run;
    }

    private ClassificationRun createRunAndOutbox(DocumentSubmission submission) {
        Media media = submission.getDocument().getMedia();
        Instant now = Instant.now();
        ClassificationRun run = ClassificationRun.queued(
                UUID.randomUUID().toString(),
                submission,
                media,
                now);
        int attempt = run.incrementAttempt();
        ClassificationRun savedRun = classificationRunRepository.save(run);

        writeRequestedEvent(savedRun, submission, now, attempt);
        return savedRun;
    }

    private void writeRequestedEvent(
            ClassificationRun run,
            DocumentSubmission submission,
            Instant now,
            int attempt) {
        Media media = run.getMedia();
        ClassificationRequestedEvent event = new ClassificationRequestedEvent(
                "v1",
                UUID.randomUUID(),
                run.getClassificationRunId(),
                submission.getDocument().getId(),
                submission.getId(),
                media.getId(),
                new ClassificationRequestedEvent.FileMetadata(
                        media.getFileName(),
                        media.getMimeType(),
                        media.getSizeBytes(),
                        media.getVerifiedEtag()),
                new ClassificationRequestedEvent.SignedGetUrl(
                        storageService.presignedGetUrl(media.getObjectKey()),
                        storageService.presignedGetUrlExpiresAt()),
                new ClassificationRequestedEvent.TaxonomySnapshot(
                        "snapshot-" + now,
                        collectionRepository.findAll(Sort.by(Sort.Direction.ASC, "slug")).stream()
                                .map(Collection::getSlug)
                                .toList(),
                        tagRepository.findAll(Sort.by(Sort.Direction.ASC, "slug")).stream()
                                .map(Tag::getSlug)
                                .toList()),
                attempt,
                now);

        OutboxEvent outboxEvent = new OutboxEvent();
        outboxEvent.setEntityType(ENTITY_TYPE);
        outboxEvent.setEntityId(run.getId());
        outboxEvent.setEventType(EVENT_TYPE);
        outboxEvent.setPayload(serialize(event));
        outboxEvent.setStatus(OutboxStatus.PENDING);
        outboxEventRepository.save(outboxEvent);
    }

    private String serialize(ClassificationRequestedEvent event) {
        try {
            return jsonMapper.writeValueAsString(event);
        } catch (JacksonException exception) {
            throw new IllegalStateException("Could not serialize classification outbox event.", exception);
        }
    }
}
