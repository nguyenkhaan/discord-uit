package com.cloudian.backend.modules.notification;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cloudian.backend.messagings.KafkaEventProducer;
import com.cloudian.backend.modules.notification.dto.NotificationRequest;

import io.swagger.v3.oas.annotations.parameters.RequestBody;

@RestController 
@RequestMapping("/kafka/notification")
public class NotificationController {
    private final KafkaEventProducer producer;

    public NotificationController(
        KafkaEventProducer producer
    ) {
        this.producer = producer;
    } 
    @PostMapping 
    public ResponseEntity<Map<String, String>> testPublishHandler(
        @RequestBody  NotificationRequest request
    ) {
        producer.publish("notification.events.v1" , request.recipientId(), request.message());
        return ResponseEntity.accepted().body(
            Map.of("status", "event accepted")
        );
    }
}
