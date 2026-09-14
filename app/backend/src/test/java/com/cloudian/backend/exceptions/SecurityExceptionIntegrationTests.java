package com.cloudian.backend.exceptions;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = "spring.autoconfigure.exclude=org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration")
@AutoConfigureMockMvc
class SecurityExceptionIntegrationTests {

	@Autowired
	private MockMvc mockMvc;

	@Test
	void returnsTheSharedSchemaWhenAnAuthenticatedEndpointHasNoJwt() throws Exception {
		mockMvc.perform(get("/auth/test-authentication"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.message").value("Authentication is required."))
				.andExpect(jsonPath("$.status").value(401))
				.andExpect(jsonPath("$.timestamp").isNotEmpty());
	}

	@Test
	void returnsTheSharedSchemaForUnmappedPublicEndpoints() throws Exception {
		mockMvc.perform(get("/docs/not-found"))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.message").value("The requested resource was not found."))
				.andExpect(jsonPath("$.status").value(404))
				.andExpect(jsonPath("$.timestamp").isNotEmpty());
	}

}
