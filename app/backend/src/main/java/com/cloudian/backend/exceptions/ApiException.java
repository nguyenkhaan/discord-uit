package com.cloudian.backend.exceptions;

import java.util.Objects;

import org.springframework.http.HttpStatusCode;

public class ApiException extends RuntimeException {

	private final HttpStatusCode status;

	public ApiException(int status, String message) {
		this(HttpStatusCode.valueOf(status), message);
	}

	public ApiException(HttpStatusCode status, String message) {
		super(message);
		this.status = Objects.requireNonNull(status, "status must not be null");
	}

	public HttpStatusCode getStatus() {
		return status;
	}

}
