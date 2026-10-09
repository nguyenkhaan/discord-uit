package com.cloudian.backend.messagings;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service 
public class KafkaAuditConsumer {
    @KafkaListener(
        topics = "notification.events.v1", 
        groupId = "audit-service"
    )
    public void consume(String message) {
        System.out.println("Notification service received: " + message);
        //Sau nay consumer nay co the su dung de luu audit log 
        /**
         * Consumer groupId: 
         * + 2 consumer cung groupId: Tất cả consumer của từng message sẽ được phân chia 
         * + 2 consumer khac groupId: ca 2 consumer sẽ được phân chia message từ partition như nhau và thực hiện xử lý độc lập 
         */
    }
}
