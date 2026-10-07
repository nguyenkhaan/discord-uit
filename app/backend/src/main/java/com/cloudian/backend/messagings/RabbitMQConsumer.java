package com.cloudian.backend.messagings;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import com.cloudian.backend.configs.RabbitMQConfig;
@Component  
public class RabbitMQConsumer {
    @RabbitListener(queues = RabbitMQConfig.QUEUE_NAME) 
    public void receiveMessage(String message) {
        System.out.println("Received message: " + message);
    }
}
