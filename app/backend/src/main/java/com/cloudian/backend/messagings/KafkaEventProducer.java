package com.cloudian.backend.messagings;

import java.util.concurrent.ExecutionException;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service 
public class KafkaEventProducer {
    private final KafkaTemplate<String, String> kafkaTemplate; 
    public KafkaEventProducer(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    } 
    public void publish(String topicName , String recipientId , String message) {
        try {
            kafkaTemplate.send(topicName, recipientId, message).get();
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Kafka publish was interrupted.", exception);
        } catch (ExecutionException exception) {
            throw new IllegalStateException("Kafka publish failed.", exception);
        }
        //recipientId: kafka key -> De sap thu tu ben trong partition  
        //message: Noi dung gui len 

    }
}
/**
 * Co che gui message cua Kafka: 
 * - He thong trien khai theo huong sao choi (1 producer - nhieu consumer): Se bao gom 1 thanh phan broker 
 * (producer) thuc hien gui message len tren topic tuong ung. Nhieu consumer, moi consumer dang ky 
 * voi 1 topic 
 * - Cac conusmer sẽ thực hiện đăng ký với topic tương ứng, mỗi khi producer gửi event đến topic A 
 * consumer nào đăng ký với topic A thì sẽ tiến hành lấy message mới nhất về và thực hiện 
 */
