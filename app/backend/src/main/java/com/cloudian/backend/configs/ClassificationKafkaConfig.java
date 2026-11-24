package com.cloudian.backend.configs;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
public class ClassificationKafkaConfig {

    public static final String REQUESTED_TOPIC = "document.classification.requested.v1";
    public static final String COMPLETED_TOPIC = "document.classification.completed.v1";
    public static final String FAILED_TOPIC = "document.classification.failed.v1";
    public static final String DEAD_LETTER_TOPIC = "document.classification.dlq.v1";
}
