package com.cloudian.backend.exceptions;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.servlet.RequestDispatcher;
import org.junit.jupiter.api.Test;
import org.springframework.boot.web.error.ErrorAttributeOptions;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.ServletWebRequest;

class GlobalErrorAttributesTests {

	private final GlobalErrorAttributes errorAttributes = new GlobalErrorAttributes();

	@Test
	void formatsSpringBootNotFoundErrorsWithTheSharedSchema() {
		MockHttpServletRequest request = new MockHttpServletRequest();
		request.setAttribute(RequestDispatcher.ERROR_STATUS_CODE, 404);

		var errorBody = errorAttributes.getErrorAttributes(
				new ServletWebRequest(request), ErrorAttributeOptions.defaults());

		assertThat(errorBody.keySet()).containsExactlyInAnyOrder("message", "status", "timestamp");
		assertThat(errorBody.get("status")).isEqualTo(404);
		assertThat(errorBody.get("timestamp")).isNotNull();
	}

}
