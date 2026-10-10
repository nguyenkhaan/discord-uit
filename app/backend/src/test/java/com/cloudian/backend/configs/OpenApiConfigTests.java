package com.cloudian.backend.configs;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import com.cloudian.backend.modules.auth.AuthController;
import com.cloudian.backend.modules.health.HealthController;

import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.models.OpenAPI;

class OpenApiConfigTests {

    @Test
    void appliesBearerAuthenticationGlobally() {
        OpenAPI openAPI = new OpenApiConfig().backendOpenApi();

        assertThat(openAPI.getSecurity())
                .singleElement()
                .satisfies(requirement -> assertThat(requirement).containsKey("bearerAuth"));
    }

    @Test
    void documentsPermitAllEndpointsAsPublic() {
        assertThat(HealthController.class.isAnnotationPresent(SecurityRequirements.class)).isTrue();
        assertThat(publicAuthMethodsHaveNoSecurityRequirement()).isTrue();
    }

    private boolean publicAuthMethodsHaveNoSecurityRequirement() {
        return java.util.Arrays.stream(AuthController.class.getDeclaredMethods())
                .filter(method -> method.getName().equals("login")
                        || method.getName().equals("register")
                        || method.getName().equals("verifyEmail"))
                .allMatch(method -> method.isAnnotationPresent(SecurityRequirements.class));
    }
}
