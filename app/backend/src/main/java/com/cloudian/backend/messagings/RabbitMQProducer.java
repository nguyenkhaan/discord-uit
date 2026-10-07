package com.cloudian.backend.messagings;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.cloudian.backend.configs.RabbitMQConfig;

@Service 
public class RabbitMQProducer {
    @Autowired 
    private RabbitTemplate rabbitTemplate;
    public void sendMessage(String message) {
        rabbitTemplate.convertAndSend(
            "", RabbitMQConfig.QUEUE_NAME, message
        );
    }
}
