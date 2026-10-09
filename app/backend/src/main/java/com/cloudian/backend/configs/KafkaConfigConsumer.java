package com.cloudian.backend.configs;

import java.util.HashMap;
import java.util.Map;

import org.apache.kafka.clients.consumer.ConsumerConfig;
//Pahi import tu kafka 
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;

@Configuration 
@EnableKafka 
public class KafkaConfigConsumer {
    @Bean 
    public ConsumerFactory<String, String> consumerFactory() {
        Map<String, Object> props = new HashMap<>(); 
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG , "localhost:9092");
        props.put(ConsumerConfig.GROUP_ID_CONFIG , "group_id");
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG , StringDeserializer.class);
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG , StringDeserializer.class);
        return new DefaultKafkaConsumerFactory<>(props);
    }
    @Bean 
    public ConcurrentKafkaListenerContainerFactory<String, String> kafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, String> factory = new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory());
        return factory;
    }
}
/**
 * Y nghia khai bao kafka-init ben trong docker-compose.yaml 
 * notification.events.v1: ten topic co version 
 * 3 partitions: cho phep scale toi da 3 consumer hoat dong song song trong mot group 
 * replication-factor 1: phu hop voi local vi chi co 1 broker (broker: diem nhan va luu tru message)
 * Kafka luu cac message ben trong topic de nhieu consumer hoac cac consumer group co the su dung doc lap voi nhau
 * 
 */