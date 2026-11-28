package com.cloudian.backend.modules.document;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import org.apache.kafka.clients.admin.Admin;
import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;

import com.cloudian.backend.modules.document.messaging.ClassificationResultConsumer;

import tools.jackson.databind.json.JsonMapper;

@EnabledIfEnvironmentVariable(named = "CLASSIFICATION_KAFKA_INTEGRATION", matches = "true")
class ClassificationKafkaIntegrationTests {

    private static final String BOOTSTRAP_SERVERS = System.getenv()
            .getOrDefault("CLASSIFICATION_KAFKA_BOOTSTRAP_SERVERS", "localhost:9092");
    private List<String> testTopics = List.of();

    @AfterEach
    void deleteTestTopics() throws Exception {
        if (testTopics.isEmpty()) {
            return;
        }
        try (Admin admin = Admin.create(Map.of("bootstrap.servers", BOOTSTRAP_SERVERS))) {
            admin.deleteTopics(testTopics).all().get(10, TimeUnit.SECONDS);
        }
    }

    @Test
    void requestAndResultEventsCrossKafkaAndReachBackendHandlers() throws Exception {
        String suffix = UUID.randomUUID().toString().replace("-", "");
        String requestedTopic = "classification-it-request-" + suffix;
        String completedTopic = "classification-it-completed-" + suffix;
        String failedTopic = "classification-it-failed-" + suffix;
        testTopics = List.of(requestedTopic, completedTopic, failedTopic);
        createTopics(requestedTopic, completedTopic, failedTopic);

        String requestedPayload = """
                {"schemaVersion":"v1","eventId":"00000000-0000-0000-0000-000000000001",
                 "classificationRunId":"run_%s","documentId":"00000000-0000-0000-0000-000000000002",
                 "submissionId":"00000000-0000-0000-0000-000000000003",
                 "mediaId":"00000000-0000-0000-0000-000000000004",
                 "file":{"fileName":"notes.txt","mimeType":"text/plain","sizeBytes":5,"verifiedEtag":"etag"},
                 "signedGetUrl":{"value":"http://localhost:9000/private/notes.txt?token=synthetic",
                   "expiresAt":"2099-11-28T00:00:00Z"},
                 "taxonomy":{"version":"v1","collectionSlugs":["research"],"tagSlugs":["research"]},
                 "attempt":1,"occurredAt":"2026-11-28T00:00:00Z"}
                """.formatted(suffix);
        String completedPayload = """
                {"schemaVersion":"v1","eventId":"00000000-0000-0000-0000-000000000011",
                 "classificationRunId":"run_%s","documentId":"00000000-0000-0000-0000-000000000002",
                 "submissionId":"00000000-0000-0000-0000-000000000003",
                 "mediaId":"00000000-0000-0000-0000-000000000004","modelId":"test/model",
                 "ocrText":"Private test text","ocrNeeded":false,
                 "collectionSuggestions":[{"slug":"research","confidence":0.91}],
                 "tagSuggestions":[{"slug":"research","confidence":0.84}],
                 "attempt":1,"occurredAt":"2026-11-28T00:00:00Z"}
                """.formatted(suffix);
        String failedPayload = """
                {"schemaVersion":"v1","eventId":"00000000-0000-0000-0000-000000000012",
                 "classificationRunId":"run_%s","documentId":"00000000-0000-0000-0000-000000000002",
                 "submissionId":"00000000-0000-0000-0000-000000000003",
                 "mediaId":"00000000-0000-0000-0000-000000000004","failureCode":"SIGNED_URL_EXPIRED",
                 "failureMessage":"The document access URL is no longer valid.","retryable":false,
                 "attempt":1,"occurredAt":"2026-11-28T00:00:00Z"}
                """.formatted(suffix);

        send(requestedTopic, requestedPayload);
        assertThat(receive(requestedTopic)).isEqualTo(requestedPayload);

        ClassificationResultService resultService = mock(ClassificationResultService.class);
        JsonMapper jsonMapper = JsonMapper.builder().findAndAddModules().build();
        ClassificationResultConsumer backendConsumer = new ClassificationResultConsumer(resultService, jsonMapper);

        send(completedTopic, completedPayload);
        backendConsumer.consumeCompleted(receive(completedTopic));
        verify(resultService).handleCompleted(argThat(event ->
                event.classificationRunId().equals("run_" + suffix)
                        && event.collectionSuggestions().get(0).confidence() == 0.91));

        send(failedTopic, failedPayload);
        backendConsumer.consumeFailed(receive(failedTopic));
        verify(resultService).handleFailed(argThat(event ->
                event.classificationRunId().equals("run_" + suffix)
                        && event.failureCode().equals("SIGNED_URL_EXPIRED")));
    }

    private void createTopics(String... topics) throws Exception {
        try (Admin admin = Admin.create(Map.of("bootstrap.servers", BOOTSTRAP_SERVERS))) {
            admin.createTopics(List.of(topics).stream()
                    .map(topic -> new NewTopic(topic, 1, (short) 1))
                    .toList())
                    .all()
                    .get(10, TimeUnit.SECONDS);
        }
    }

    private void send(String topic, String payload) throws Exception {
        Properties properties = new Properties();
        properties.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, BOOTSTRAP_SERVERS);
        properties.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
        properties.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
        properties.put(ProducerConfig.ACKS_CONFIG, "all");
        try (KafkaProducer<String, String> producer = new KafkaProducer<>(properties)) {
            producer.send(new ProducerRecord<>(topic, "test", payload)).get(10, TimeUnit.SECONDS);
        }
    }

    private String receive(String topic) {
        Properties properties = new Properties();
        properties.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, BOOTSTRAP_SERVERS);
        properties.put(ConsumerConfig.GROUP_ID_CONFIG, "classification-it-" + UUID.randomUUID());
        properties.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        properties.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, "false");
        properties.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
        properties.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
        try (KafkaConsumer<String, String> consumer = new KafkaConsumer<>(properties)) {
            consumer.subscribe(List.of(topic));
            long deadline = System.nanoTime() + Duration.ofSeconds(10).toNanos();
            while (System.nanoTime() < deadline) {
                var records = consumer.poll(Duration.ofMillis(250));
                if (!records.isEmpty()) {
                    return records.iterator().next().value();
                }
            }
        }
        throw new AssertionError("No event received from Kafka topic " + topic);
    }
}
