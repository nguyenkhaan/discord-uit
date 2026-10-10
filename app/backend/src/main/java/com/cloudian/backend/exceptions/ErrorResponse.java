package com.cloudian.backend.exceptions;

import java.time.Instant;
import java.util.Map;
import java.util.Objects;

import org.springframework.http.HttpStatusCode;

public record ErrorResponse(String message, int status, Instant timestamp , String notification) {

	public ErrorResponse {

		Objects.requireNonNull(message, "message must not be null");
		Objects.requireNonNull(timestamp, "timestamp must not be null");
	}

	public static ErrorResponse of(HttpStatusCode status, String message) {
		return new ErrorResponse(message, status.value(), Instant.now() , "Cloudian Notification!!!");
	}

	public static String defaultMessage(HttpStatusCode status) {
		return switch (status.value()) {
			case 400 -> "The request is invalid.";
			case 401 -> "Authentication is required.";
			case 403 -> "Access is denied.";
			case 404 -> "The requested resource was not found.";
			case 405 -> "The request method is not supported.";
			case 415 -> "The content type is not supported.";
			case 500 -> "An unexpected error occurred.";
			default -> "The request could not be processed.";
		};
	}

	public Map<String, Object> toAttributes() {
		return Map.of("message", message, "status", status, "timestamp", timestamp , "notification", notification);
	}
}
