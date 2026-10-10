package com.cloudian.backend.modules.notification;

import java.util.Map;
import java.util.concurrent.TimeUnit;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cloudian.backend.modules.notification.dto.NotificationRequest;
import com.cloudian.backend.modules.notification.messaging.KafkaNotificationPublisher;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/kafka/notifications")
@ConditionalOnProperty(name = "app.kafka.demo.enabled", havingValue = "true")
public class NotificationController {
	private static final long SEND_TIMEOUT_SECONDS = 10;

	private final KafkaNotificationPublisher publisher;

	public NotificationController(KafkaNotificationPublisher publisher) {
		this.publisher = publisher;
	}

	@PostMapping
	public ResponseEntity<Map<String, String>> publish(@Valid @RequestBody NotificationRequest request) {
		try {
			publisher.publish(request.recipientId(), request.message())
					.orTimeout(SEND_TIMEOUT_SECONDS, TimeUnit.SECONDS)
					.join();
			return ResponseEntity.accepted().body(Map.of("status", "event accepted"));
		} catch (RuntimeException exception) {
			return ResponseEntity.status(503).body(Map.of("status", "event rejected"));
		}
	}
}
