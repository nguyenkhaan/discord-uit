package com.cloudian.backend.exceptions;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletResponse;

class ErrorResponseWriterTests {

	private final ObjectMapper objectMapper = new ObjectMapper();
	private final ErrorResponseWriter errorResponseWriter = new ErrorResponseWriter();

	@Test
	void writesTheSharedErrorSchemaForUnauthorizedRequests() throws Exception {
		MockHttpServletResponse response = new MockHttpServletResponse();

		errorResponseWriter.write(response, HttpStatus.UNAUTHORIZED, "Authentication is required.");

		JsonNode errorBody = objectMapper.readTree(response.getContentAsByteArray());
		assertThat(response.getStatus()).isEqualTo(401);
		assertThat(response.getContentType()).startsWith("application/json");
		assertThat(errorBody.size()).isEqualTo(3);
		assertThat(errorBody.has("message")).isTrue();
		assertThat(errorBody.has("status")).isTrue();
		assertThat(errorBody.has("timestamp")).isTrue();
		assertThat(errorBody.path("message").asText()).isEqualTo("Authentication is required.");
		assertThat(errorBody.path("status").asInt()).isEqualTo(401);
		assertThat(errorBody.path("timestamp").asText()).isNotBlank();
	}

}
