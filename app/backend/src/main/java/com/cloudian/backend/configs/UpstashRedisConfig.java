package com.cloudian.backend.configs;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.web.client.RestClient;

@Configuration
public class UpstashRedisConfig {

    @Bean
    public RestClient upstashRestClient(
            @Value("${upstash.redis.rest.url}") String restUrl,
            @Value("${upstash.redis.rest.token}") String restToken
    ) {
        return RestClient.builder()
                .baseUrl(restUrl)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + restToken)
                .build();
    }
}
