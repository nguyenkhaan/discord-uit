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
import com.cloudian.backend.configs.ClassificationKafkaConfig;
import com.cloudian.backend.messagings.KafkaEventProducer;
import com.cloudian.backend.models.OutboxEvent;
import com.cloudian.backend.repositories.OutboxEventRepository;

@Component
public class ClassificationOutboxPublisher {

    private static final Logger LOGGER = LoggerFactory.getLogger(ClassificationOutboxPublisher.class);
    private static final String ENTITY_TYPE = "DOCUMENT_CLASSIFICATION";

    private final OutboxEventRepository outboxEventRepository;
    private final KafkaEventProducer kafkaEventProducer;
    private final int maxAttempts;

    public ClassificationOutboxPublisher(
            OutboxEventRepository outboxEventRepository,
            KafkaEventProducer kafkaEventProducer,
            @Value("${app.classification.outbox.max-attempts:3}") int maxAttempts) {
        if (maxAttempts < 1) {
            throw new IllegalArgumentException("maxAttempts must be positive.");
        }
        this.outboxEventRepository = outboxEventRepository;
        this.kafkaEventProducer = kafkaEventProducer;
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
                    event.getPayload());
            event.setStatus(OutboxStatus.PUBLISHED);
            event.setPublishedAt(Instant.now());
        } catch (RuntimeException exception) {
            int attempt = event.getAttemptCount() + 1;
            event.setAttemptCount(attempt);
            event.setStatus(attempt >= maxAttempts
                    ? OutboxStatus.DEAD_LETTER
                    : OutboxStatus.PENDING);
            LOGGER.warn(
                    "Classification outbox event {} failed on attempt {} with status {}",
                    event.getId(),
                    attempt,
                    event.getStatus());
        }
        outboxEventRepository.save(event);
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
