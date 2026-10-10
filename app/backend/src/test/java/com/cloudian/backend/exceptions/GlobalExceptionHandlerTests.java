package com.cloudian.backend.exceptions;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.ResponseEntity;

class GlobalExceptionHandlerTests {

	private final GlobalExceptionHandler exceptionHandler = new GlobalExceptionHandler();

	@ParameterizedTest
	@ValueSource(ints = {400, 401, 403})
	void returnsTheApiExceptionStatusForTheFrontend(int status) {
		ResponseEntity<ErrorResponse> response = exceptionHandler.handleApiException(
				new ApiException(status, "Request cannot be processed."));
		ErrorResponse errorResponse = response.getBody();

		assertThat(response.getStatusCode().value()).isEqualTo(status);
		assertThat(errorResponse).isNotNull();
		assertThat(errorResponse.message()).isEqualTo("Request cannot be processed.");
		assertThat(errorResponse.status()).isEqualTo(status);
		assertThat(errorResponse.timestamp()).isNotNull();
	}

}
