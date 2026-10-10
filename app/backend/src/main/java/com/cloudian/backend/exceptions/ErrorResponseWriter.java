package com.cloudian.backend.exceptions;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletResponse;

@Component
public class ErrorResponseWriter {

	private static final int FIRST_PRINTABLE_CHARACTER = 0x20;

	public void write(HttpServletResponse response, HttpStatusCode status, String message) throws IOException {
		ErrorResponse errorResponse = ErrorResponse.of(status, message);
		response.setStatus(status.value());
		response.setContentType(MediaType.APPLICATION_JSON_VALUE);
		response.setCharacterEncoding(StandardCharsets.UTF_8.name());
		response.getWriter().write(toJson(errorResponse));
	}

	private String toJson(ErrorResponse errorResponse) {
		return "{\"message\":\"%s\",\"status\":%d,\"timestamp\":\"%s\"}".formatted(
			escapeJson(errorResponse.message()),
			errorResponse.status(),
			errorResponse.timestamp());
	}

	private String escapeJson(String value) {
		StringBuilder escapedValue = new StringBuilder();
		for (int index = 0; index < value.length(); index++) {
			char character = value.charAt(index);
			switch (character) {
				case '"' -> escapedValue.append("\\\"");
				case '\\' -> escapedValue.append("\\\\");
				case '\b' -> escapedValue.append("\\b");
				case '\f' -> escapedValue.append("\\f");
				case '\n' -> escapedValue.append("\\n");
				case '\r' -> escapedValue.append("\\r");
				case '\t' -> escapedValue.append("\\t");
				default -> appendEscapedCharacter(escapedValue, character);
			}
		}
		return escapedValue.toString();
	}

	private void appendEscapedCharacter(StringBuilder escapedValue, char character) {
		if (character < FIRST_PRINTABLE_CHARACTER) {
			escapedValue.append("\\u%04x".formatted((int) character));
			return;
		}
		escapedValue.append(character);
	}

}
