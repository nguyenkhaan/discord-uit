package com.cloudian.backend.services;

import java.time.Duration;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class RedisService {

    private final RestClient restClient;

    public RedisService(@Qualifier("upstashRestClient") RestClient restClient) {
        this.restClient = restClient;
    }

    public void set(String key, String value, Duration ttl) {
        Objects.requireNonNull(key, "key must not be null");
        Objects.requireNonNull(value, "value must not be null");
        Objects.requireNonNull(ttl, "ttl must not be null");

        long ttlSeconds = ttl.toSeconds();
        if (ttlSeconds < 1) {
            throw new IllegalArgumentException("ttl must be at least one second");
        }

        execute(List.of("SET", key, value, "EX", ttlSeconds));
    }

    public Optional<String> get(String key) {
        Objects.requireNonNull(key, "key must not be null");
        return stringResult(execute(List.of("GET", key)));
    }

    public Optional<String> getAndDelete(String key) {
        Objects.requireNonNull(key, "key must not be null");
        return stringResult(execute(List.of("GETDEL", key)));
    }

    public void delete(String key) {
        Objects.requireNonNull(key, "key must not be null");
        execute(List.of("DEL", key));
    }

    private Object execute(List<?> command) {
        UpstashResponse response = restClient.post()
                .body(command)
                .retrieve()
                .body(UpstashResponse.class);

        if (response == null) {
            throw new IllegalStateException("Upstash Redis returned an empty response");
        }
        if (response.error() != null) {
            throw new IllegalStateException("Upstash Redis command failed");
        }
        return response.result();
    }

    private Optional<String> stringResult(Object result) {
        if (result == null) {
            return Optional.empty();
        }
        return Optional.of(result.toString());
    }

    private record UpstashResponse(Object result, String error) {
    }
}
