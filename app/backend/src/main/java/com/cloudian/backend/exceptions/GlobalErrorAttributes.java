package com.cloudian.backend.exceptions;

import java.util.Map;

import org.springframework.boot.web.error.ErrorAttributeOptions;
import org.springframework.boot.webmvc.error.DefaultErrorAttributes;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.WebRequest;

@Component
public class GlobalErrorAttributes extends DefaultErrorAttributes {

	@Override
	public Map<String, Object> getErrorAttributes(WebRequest webRequest, ErrorAttributeOptions options) {
		Map<String, Object> attributes = super.getErrorAttributes(webRequest, options);
		HttpStatusCode status = resolveStatus(attributes.get("status"));
		return ErrorResponse.of(status, ErrorResponse.defaultMessage(status)).toAttributes();
	}

	private HttpStatusCode resolveStatus(Object statusValue) {
		if (statusValue instanceof Integer status) {
			return HttpStatusCode.valueOf(status);
		}
		return HttpStatus.INTERNAL_SERVER_ERROR;
	}

}
