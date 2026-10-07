package com.cloudian.backend.configs;

import org.springframework.amqp.core.Queue;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration 
public class RabbitMQConfig {
    public static final String QUEUE_NAME = "CLOUDIAN_QUEUE";
    @Bean 
    public Queue cloudianQueue() {
        return new Queue(QUEUE_NAME , true);
    }
}
