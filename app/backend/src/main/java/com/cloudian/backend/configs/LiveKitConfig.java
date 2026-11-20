
package com.cloudian.backend.configs;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.livekit.server.RoomServiceClient;

@Configuration
public class LiveKitConfig {

    @Bean
    public RoomServiceClient roomServiceClient(
            LiveKitProperties properties) {

        return RoomServiceClient.create(
                properties.getUrl(),
                properties.getApiKey(),
                properties.getApiSecret());
    }
}
