package com.cloudian.backend.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import jakarta.validation.ConstraintViolationException;

@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(ApiException.class)
	public ResponseEntity<ErrorResponse> handleApiException(ApiException exception) {
		return createErrorResponse(exception.getStatus(), exception.getMessage());
	}

	@ExceptionHandler(AuthenticationException.class)
	public ResponseEntity<ErrorResponse> handleAuthenticationException(AuthenticationException exception) {
		return createErrorResponse(HttpStatus.UNAUTHORIZED, ErrorResponse.defaultMessage(HttpStatus.UNAUTHORIZED));
	}

	@ExceptionHandler(AccessDeniedException.class)
	public ResponseEntity<ErrorResponse> handleAccessDeniedException(AccessDeniedException exception) {
		return createErrorResponse(HttpStatus.FORBIDDEN, ErrorResponse.defaultMessage(HttpStatus.FORBIDDEN));
	}

	@ExceptionHandler({
			MethodArgumentNotValidException.class,
			ConstraintViolationException.class,
			HttpMessageNotReadableException.class
	})
	public ResponseEntity<ErrorResponse> handleBadRequest(Exception exception) {
		return createErrorResponse(HttpStatus.BAD_REQUEST, ErrorResponse.defaultMessage(HttpStatus.BAD_REQUEST));
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ErrorResponse> handleUnexpectedException(Exception exception) {
		if (exception instanceof org.springframework.web.ErrorResponse errorResponse) {
			HttpStatusCode status = errorResponse.getStatusCode();
			return createErrorResponse(status, ErrorResponse.defaultMessage(status));
		}
		return createErrorResponse(
				HttpStatus.INTERNAL_SERVER_ERROR,
				ErrorResponse.defaultMessage(HttpStatus.INTERNAL_SERVER_ERROR));
	}

	private ResponseEntity<ErrorResponse> createErrorResponse(HttpStatusCode status, String message) {
		return ResponseEntity.status(status).body(ErrorResponse.of(status, message));
	}

}
