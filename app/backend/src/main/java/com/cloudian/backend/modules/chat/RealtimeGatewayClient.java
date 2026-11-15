
package com.cloudian.backend.modules.chat;

import java.net.http.HttpClient;
import java.util.UUID;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class RealtimeGatewayClient {

    private final RestClient restClient;
    private final String gatewayServiceToken;

    public RealtimeGatewayClient(
            @Value("${app.realtime.gateway-url}") String gatewayUrl,
            @Value("${app.realtime.gateway-token}") String gatewayServiceToken) {

        // Gateway (Socket.IO) cắt kết nối khi client đòi nâng cấp HTTP/2, nên dùng HTTP/1.1
        HttpClient httpClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .build();

        this.restClient = RestClient.builder()
                .baseUrl(gatewayUrl)
                .requestFactory(new JdkClientHttpRequestFactory(httpClient))
                .build();

        this.gatewayServiceToken = gatewayServiceToken;
    }

    public void notifyMessageReactionUpdated(
            UUID serverId,
            UUID messageId,
            List<ReactionPayload> reactions) {

        MessageReactionUpdatedPayload payload = new MessageReactionUpdatedPayload(
                serverId,
                messageId,
                reactions);

        restClient.post()
                .uri("/internal/realtime/events/message-reaction-updated")
                .header("X-Gateway-Token", gatewayServiceToken)
                .contentType(MediaType.APPLICATION_JSON)
                .body(payload)
                .retrieve()
                .toBodilessEntity();

        log.info(
                "Sent message reaction update to Gateway. serverId={}, messageId={}",
                serverId,
                messageId);
    }

    public record MessageReactionUpdatedPayload(
            UUID serverId,
            UUID messageId,
            List<ReactionPayload> reactions) {
    }

    public record ReactionPayload(
            UUID iconId,
            String iconImage,
            String name,
            long count) {
    }
}
