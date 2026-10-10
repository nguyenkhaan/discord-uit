package com.cloudian.backend.modules.notification.messaging;

import java.util.concurrent.CompletableFuture;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "app.kafka.demo.enabled", havingValue = "true")
public class KafkaNotificationPublisher {

	static final String TOPIC_NAME = "notification.events.v1";

	private final KafkaTemplate<String, String> kafkaTemplate;

	public KafkaNotificationPublisher(KafkaTemplate<String, String> kafkaTemplate) {
		this.kafkaTemplate = kafkaTemplate;
	}

	public CompletableFuture<SendResult<String, String>> publish(String recipientId, String message) {
		return kafkaTemplate.send(TOPIC_NAME, recipientId, message);
	}
}
