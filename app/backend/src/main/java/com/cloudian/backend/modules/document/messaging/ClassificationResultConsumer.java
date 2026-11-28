package com.cloudian.backend.modules.document.messaging;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import com.cloudian.backend.configs.ClassificationKafkaConfig;
import com.cloudian.backend.modules.document.ClassificationResultService;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

@Component
public class ClassificationResultConsumer {

    private static final Logger LOGGER = LoggerFactory.getLogger(ClassificationResultConsumer.class);

    private final ClassificationResultService resultService;
    private final JsonMapper jsonMapper;

    public ClassificationResultConsumer(ClassificationResultService resultService, JsonMapper jsonMapper) {
        this.resultService = resultService;
        this.jsonMapper = jsonMapper;
    }

    @KafkaListener(
            topics = ClassificationKafkaConfig.COMPLETED_TOPIC,
            groupId = "${app.classification.consumer.group-id:document-classification-results}")
    public void consumeCompleted(String payload) {
        ClassificationCompletedEvent event;
        try {
            event = jsonMapper.readValue(payload, ClassificationCompletedEvent.class);
        } catch (JacksonException | IllegalArgumentException exception) {
            LOGGER.warn("Discarding malformed classification completion event.");
            return;
        }
        if (event == null) {
            LOGGER.warn("Discarding empty classification completion event.");
            return;
        }

        ClassificationResultService.Disposition result = resultService.handleCompleted(event);
        if (result != ClassificationResultService.Disposition.APPLIED) {
            LOGGER.warn("Classification completion was {} for run {}", result, event.classificationRunId());
        }
    }

    @KafkaListener(
            topics = ClassificationKafkaConfig.FAILED_TOPIC,
            groupId = "${app.classification.consumer.group-id:document-classification-results}")
    public void consumeFailed(String payload) {
        ClassificationFailedEvent event;
        try {
            event = jsonMapper.readValue(payload, ClassificationFailedEvent.class);
        } catch (JacksonException | IllegalArgumentException exception) {
            LOGGER.warn("Discarding malformed classification failure event.");
            return;
        }
        if (event == null) {
            LOGGER.warn("Discarding empty classification failure event.");
            return;
        }

        ClassificationResultService.Disposition result = resultService.handleFailed(event);
        if (result != ClassificationResultService.Disposition.APPLIED) {
            LOGGER.warn("Classification failure event was {} for run {}", result, event.classificationRunId());
        }
    }
}
