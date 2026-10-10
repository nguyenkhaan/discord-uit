package com.cloudian.backend.modules.notification;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.concurrent.CompletableFuture;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.cloudian.backend.exceptions.ErrorResponseWriter;
import com.cloudian.backend.exceptions.GlobalExceptionHandler;
import com.cloudian.backend.filters.JwtRequestFilter;
import com.cloudian.backend.modules.notification.messaging.KafkaNotificationPublisher;
import com.cloudian.backend.security.SecurityConfig;
import com.cloudian.backend.services.CustomUserDetailsService;
import com.cloudian.backend.utils.JwtUtil;

@WebMvcTest(
		controllers = NotificationController.class,
		properties = {
				"app.kafka.demo.enabled=true",
				"server.servlet.context-path="
		})
@Import({ SecurityConfig.class, JwtRequestFilter.class, ErrorResponseWriter.class, GlobalExceptionHandler.class })
class NotificationControllerTests {

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private KafkaNotificationPublisher publisher;

	@MockitoBean
	private CustomUserDetailsService customUserDetailsService;

	@MockitoBean
	private JwtUtil jwtUtil;

	@Test
	void rejectsUnauthenticatedRequests() throws Exception {
		mockMvc.perform(post("/kafka/notifications")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"recipientId":"user-1","message":"hello"}
						"""))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void acceptsAnAcknowledgedEvent() throws Exception {
		when(publisher.publish("user-1", "hello"))
				.thenReturn(CompletableFuture.completedFuture(null));

		mockMvc.perform(post("/kafka/notifications")
				.with(user("cloudian"))
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"recipientId":"user-1","message":"hello"}
						"""))
				.andExpect(status().isAccepted())
				.andExpect(jsonPath("$.status").value("event accepted"));

		verify(publisher).publish("user-1", "hello");
	}

	@Test
	void rejectsBlankInput() throws Exception {
		mockMvc.perform(post("/kafka/notifications")
				.with(user("cloudian"))
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"recipientId":" ","message":" "}
						"""))
				.andExpect(status().isBadRequest());
	}

	@Test
	void rejectsOversizedInput() throws Exception {
		String message = "a".repeat(1_001);

		mockMvc.perform(post("/kafka/notifications")
				.with(user("cloudian"))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"recipientId\":\"user-1\",\"message\":\"%s\"}".formatted(message)))
				.andExpect(status().isBadRequest());
	}

	@Test
	void rejectsAnEventWhenKafkaFails() throws Exception {
		when(publisher.publish("user-1", "hello"))
				.thenReturn(CompletableFuture.failedFuture(new IllegalStateException("broker unavailable")));

		mockMvc.perform(post("/kafka/notifications")
				.with(user("cloudian"))
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"recipientId":"user-1","message":"hello"}
						"""))
				.andExpect(status().isServiceUnavailable())
				.andExpect(jsonPath("$.status").value("event rejected"));
	}
}
