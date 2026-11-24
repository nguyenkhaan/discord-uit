package com.cloudian.backend.modules.document.messaging;

import java.time.Instant;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.transaction.annotation.Transactional;

import com.cloudian.backend.commons.enums.OutboxStatus;
import com.cloudian.backend.commons.enums.ClassificationRunStatus;
import com.cloudian.backend.configs.ClassificationKafkaConfig;
import com.cloudian.backend.messagings.KafkaEventProducer;
import com.cloudian.backend.models.ClassificationRun;
import com.cloudian.backend.models.Media;
import com.cloudian.backend.models.OutboxEvent;
import com.cloudian.backend.repositories.ClassificationRunRepository;
import com.cloudian.backend.repositories.OutboxEventRepository;
import com.cloudian.backend.services.StorageService;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

@Component
public class ClassificationOutboxPublisher {

    private static final Logger LOGGER = LoggerFactory.getLogger(ClassificationOutboxPublisher.class);
    private static final String ENTITY_TYPE = "DOCUMENT_CLASSIFICATION";

    private final OutboxEventRepository outboxEventRepository;
    private final KafkaEventProducer kafkaEventProducer;
    private final ClassificationRunRepository classificationRunRepository;
    private final StorageService storageService;
    private final JsonMapper jsonMapper;
    private final int maxAttempts;

    public ClassificationOutboxPublisher(
            OutboxEventRepository outboxEventRepository,
            KafkaEventProducer kafkaEventProducer,
            ClassificationRunRepository classificationRunRepository,
            StorageService storageService,
            JsonMapper jsonMapper,
            @Value("${app.classification.outbox.max-attempts:3}") int maxAttempts) {
        if (maxAttempts < 1) {
            throw new IllegalArgumentException("maxAttempts must be positive.");
        }
        this.outboxEventRepository = outboxEventRepository;
        this.kafkaEventProducer = kafkaEventProducer;
        this.classificationRunRepository = classificationRunRepository;
        this.storageService = storageService;
        this.jsonMapper = jsonMapper;
        this.maxAttempts = maxAttempts;
    }

    @Scheduled(fixedDelayString = "${app.classification.outbox.poll-delay-ms:5000}")
    @Transactional
    public void publishPending() {
        List<OutboxEvent> events = outboxEventRepository
                .findByEntityTypeAndStatusOrderByCreatedAtAsc(ENTITY_TYPE, OutboxStatus.PENDING);
        for (OutboxEvent event : events) {
            publishOne(event);
        }
    }

    private void publishOne(OutboxEvent event) {
        try {
            kafkaEventProducer.publish(
                    topicFor(event.getEventType()),
                    event.getEntityId().toString(),
                    payloadForPublish(event));
            event.setStatus(OutboxStatus.PUBLISHED);
            event.setPublishedAt(Instant.now());
        } catch (RuntimeException exception) {
            int attempt = event.getAttemptCount() + 1;
            event.setAttemptCount(attempt);
            event.setStatus(attempt >= maxAttempts
                    ? OutboxStatus.DEAD_LETTER
                    : OutboxStatus.PENDING);
            if (event.getStatus() == OutboxStatus.DEAD_LETTER) {
                classificationRunRepository.findById(event.getEntityId()).ifPresent(run -> {
                    run.setFailure("OUTBOX_DEAD_LETTER", "Classification request could not be published.");
                    run.transitionTo(ClassificationRunStatus.DEAD_LETTER, Instant.now());
                    classificationRunRepository.save(run);
                });
            }
            LOGGER.warn(
                    "Classification outbox event {} failed on attempt {} with status {}",
                    event.getId(),
                    attempt,
                    event.getStatus());
        }
        outboxEventRepository.save(event);
    }

    private String payloadForPublish(OutboxEvent event) {
        if (!"DOCUMENT_CLASSIFICATION_REQUESTED_V1".equals(event.getEventType())
                || event.getPayload() == null
                || !event.getPayload().contains("\"signedGetUrl\"")) {
            return event.getPayload();
        }

        ClassificationRequestedEvent requested;
        try {
            requested = jsonMapper.readValue(event.getPayload(), ClassificationRequestedEvent.class);
        } catch (JacksonException exception) {
            return event.getPayload();
        }
        if (requested.signedGetUrl().expiresAt().isAfter(Instant.now().plusSeconds(30))) {
            return event.getPayload();
        }

        ClassificationRun run = classificationRunRepository.findById(event.getEntityId())
                .orElseThrow(() -> new IllegalStateException("Classification run for outbox event was not found."));
        Media media = run.getMedia();
        if (media == null || media.getObjectKey() == null) {
            throw new IllegalStateException("Classification media for outbox event was not found.");
        }

        ClassificationRequestedEvent refreshed = new ClassificationRequestedEvent(
                requested.schemaVersion(),
                requested.eventId(),
                requested.classificationRunId(),
                requested.documentId(),
                requested.submissionId(),
                requested.mediaId(),
                requested.file(),
                new ClassificationRequestedEvent.SignedGetUrl(
                        storageService.presignedGetUrl(media.getObjectKey()),
                        storageService.presignedGetUrlExpiresAt()),
                requested.taxonomy(),
                requested.attempt(),
                requested.occurredAt());
        try {
            return jsonMapper.writeValueAsString(refreshed);
        } catch (JacksonException exception) {
            throw new IllegalStateException("Could not refresh classification outbox event.", exception);
        }
    }

    private static String topicFor(String eventType) {
        return switch (eventType) {
            case "DOCUMENT_CLASSIFICATION_REQUESTED_V1" -> ClassificationKafkaConfig.REQUESTED_TOPIC;
            case "DOCUMENT_CLASSIFICATION_COMPLETED_V1" -> ClassificationKafkaConfig.COMPLETED_TOPIC;
            case "DOCUMENT_CLASSIFICATION_FAILED_V1" -> ClassificationKafkaConfig.FAILED_TOPIC;
            case "DOCUMENT_CLASSIFICATION_DEAD_LETTER_V1" -> ClassificationKafkaConfig.DEAD_LETTER_TOPIC;
            default -> throw new IllegalArgumentException("Unsupported classification event type.");
        };
    }
}
