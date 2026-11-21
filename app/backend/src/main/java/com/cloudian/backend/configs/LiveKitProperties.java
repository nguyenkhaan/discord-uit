
package com.cloudian.backend.configs;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.livekit")
public class LiveKitProperties {

    private String url;
    private String websocketUrl;
    private String apiKey;
    private String apiSecret;

}
