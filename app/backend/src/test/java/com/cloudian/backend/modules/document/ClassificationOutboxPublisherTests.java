package com.cloudian.backend.modules.document;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.cloudian.backend.commons.enums.OutboxStatus;
import com.cloudian.backend.messagings.KafkaEventProducer;
import com.cloudian.backend.models.OutboxEvent;
import com.cloudian.backend.configs.ClassificationKafkaConfig;
import com.cloudian.backend.modules.document.messaging.ClassificationOutboxPublisher;
import com.cloudian.backend.modules.document.messaging.ClassificationRequestedEvent;
import com.cloudian.backend.models.Media;
import com.cloudian.backend.models.ClassificationRun;
import com.cloudian.backend.repositories.OutboxEventRepository;
import com.cloudian.backend.repositories.ClassificationRunRepository;
import com.cloudian.backend.services.StorageService;

import tools.jackson.databind.json.JsonMapper;

@ExtendWith(MockitoExtension.class)
class ClassificationOutboxPublisherTests {

    private static final UUID EVENT_ID = UUID.fromString("00000000-0000-0000-0000-000000007001");
    private static final UUID RUN_ID = UUID.fromString("00000000-0000-0000-0000-000000007002");

    @Mock
    private OutboxEventRepository outboxEventRepository;

    @Mock
    private KafkaEventProducer kafkaEventProducer;

    @Mock
    private ClassificationRunRepository classificationRunRepository;

    @Mock
    private StorageService storageService;

    @Test
    void publishesPendingClassificationRequestAndMarksItPublished() {
        OutboxEvent event = pendingEvent(0);
        when(outboxEventRepository.findByEntityTypeAndStatusOrderByCreatedAtAsc(
                "DOCUMENT_CLASSIFICATION", OutboxStatus.PENDING))
                .thenReturn(List.of(event));
        ClassificationOutboxPublisher publisher = publisher(3);

        publisher.publishPending();

        verify(kafkaEventProducer).publish(
                eq(ClassificationKafkaConfig.REQUESTED_TOPIC),
                eq(RUN_ID.toString()),
                eq("{\"classificationRunId\":\"run-1\"}"));
        assertThat(event.getStatus()).isEqualTo(OutboxStatus.PUBLISHED);
        assertThat(event.getPublishedAt()).isNotNull();
        verify(outboxEventRepository).save(event);
    }

    @Test
    void keepsEventPendingAfterRetryablePublishFailure() {
        OutboxEvent event = pendingEvent(1);
        when(outboxEventRepository.findByEntityTypeAndStatusOrderByCreatedAtAsc(
                "DOCUMENT_CLASSIFICATION", OutboxStatus.PENDING))
                .thenReturn(List.of(event));
        doThrow(new IllegalStateException("Kafka unavailable"))
                .when(kafkaEventProducer)
                .publish(any(), any(), any());
        ClassificationOutboxPublisher publisher = publisher(3);

        publisher.publishPending();

        assertThat(event.getAttemptCount()).isEqualTo(2);
        assertThat(event.getStatus()).isEqualTo(OutboxStatus.PENDING);
        verify(outboxEventRepository).save(event);
    }

    @Test
    void deadLettersEventWhenRetryLimitIsExhausted() {
        OutboxEvent event = pendingEvent(2);
        when(outboxEventRepository.findByEntityTypeAndStatusOrderByCreatedAtAsc(
                "DOCUMENT_CLASSIFICATION", OutboxStatus.PENDING))
                .thenReturn(List.of(event));
        doThrow(new IllegalStateException("Kafka unavailable"))
                .when(kafkaEventProducer)
                .publish(any(), any(), any());
        ClassificationRun run = org.mockito.Mockito.mock(ClassificationRun.class);
        when(classificationRunRepository.findById(RUN_ID)).thenReturn(java.util.Optional.of(run));
        ClassificationOutboxPublisher publisher = publisher(3);

        publisher.publishPending();

        assertThat(event.getAttemptCount()).isEqualTo(3);
        assertThat(event.getStatus()).isEqualTo(OutboxStatus.DEAD_LETTER);
        verify(run).transitionTo(eq(com.cloudian.backend.commons.enums.ClassificationRunStatus.DEAD_LETTER), any());
        verify(classificationRunRepository).save(run);
        verify(outboxEventRepository).save(event);
    }

    @Test
    void refreshesExpiredSignedUrlBeforePublishing() throws Exception {
        OutboxEvent event = pendingEvent(0);
        event.setPayload(requestPayload(Instant.now().minusSeconds(1)));
        when(outboxEventRepository.findByEntityTypeAndStatusOrderByCreatedAtAsc(
                "DOCUMENT_CLASSIFICATION", OutboxStatus.PENDING))
                .thenReturn(List.of(event));

        ClassificationRun run = org.mockito.Mockito.mock(ClassificationRun.class);
        Media media = new Media();
        media.setObjectKey("documents/course.pdf");
        when(classificationRunRepository.findById(RUN_ID)).thenReturn(java.util.Optional.of(run));
        when(run.getMedia()).thenReturn(media);
        when(storageService.presignedGetUrl("documents/course.pdf"))
                .thenReturn("https://storage.example/refreshed");
        when(storageService.presignedGetUrlExpiresAt())
                .thenReturn(Instant.now().plusSeconds(900));

        publisher(3).publishPending();

        org.mockito.ArgumentCaptor<String> payloadCaptor = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(kafkaEventProducer).publish(
                eq(ClassificationKafkaConfig.REQUESTED_TOPIC),
                eq(RUN_ID.toString()),
                payloadCaptor.capture());
        assertThat(JsonMapper.builder().build().readTree(payloadCaptor.getValue())
                .get("signedGetUrl").get("value").stringValue())
                .isEqualTo("https://storage.example/refreshed");
    }

    private ClassificationOutboxPublisher publisher(int maxAttempts) {
        return new ClassificationOutboxPublisher(
                outboxEventRepository,
                kafkaEventProducer,
                classificationRunRepository,
                storageService,
                JsonMapper.builder().build(),
                maxAttempts);
    }

    private static OutboxEvent pendingEvent(int attemptCount) {
        OutboxEvent event = new OutboxEvent();
        event.setId(EVENT_ID);
        event.setEntityType("DOCUMENT_CLASSIFICATION");
        event.setEntityId(RUN_ID);
        event.setEventType("DOCUMENT_CLASSIFICATION_REQUESTED_V1");
        event.setPayload("{\"classificationRunId\":\"run-1\"}");
        event.setStatus(OutboxStatus.PENDING);
        event.setAttemptCount(attemptCount);
        return event;
    }

    private static String requestPayload(Instant expiresAt) throws Exception {
        return JsonMapper.builder().build().writeValueAsString(new ClassificationRequestedEvent(
                "v1",
                UUID.fromString("00000000-0000-0000-0000-000000007003"),
                "run-1",
                UUID.fromString("00000000-0000-0000-0000-000000007004"),
                UUID.fromString("00000000-0000-0000-0000-000000007005"),
                UUID.fromString("00000000-0000-0000-0000-000000007006"),
                new ClassificationRequestedEvent.FileMetadata(
                        "course.pdf", "application/pdf", 128, "verified-etag"),
                new ClassificationRequestedEvent.SignedGetUrl("https://storage.example/expired", expiresAt),
                new ClassificationRequestedEvent.TaxonomySnapshot("snapshot-v1", List.of(), List.of()),
                1,
                Instant.now()));
    }
}
