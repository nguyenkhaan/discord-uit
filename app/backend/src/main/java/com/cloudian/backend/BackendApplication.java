package com.cloudian.backend;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;

@SpringBootApplication
public class BackendApplication {

	private static final String DEFAULT_PORT = "4000";
	private static final String LOCAL_SERVER_PORT_PROPERTY = "local.server.port";
	private static final String SERVER_PORT_PROPERTY = "server.port";
	private static final String API_DOCUMENTATION_URL = "http://localhost:%s/api/docs";
	private static final DateTimeFormatter STARTED_AT_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
	private static final String ANSI_CYAN = "\u001B[96m";
	private static final String ANSI_GREEN = "\u001B[92m";
	private static final String ANSI_RESET = "\u001B[0m";

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

	@EventListener(ApplicationReadyEvent.class)
	void printStartupStatus(ApplicationReadyEvent event) {
		Environment environment = event.getApplicationContext().getEnvironment();
		String port = environment.getProperty(
				LOCAL_SERVER_PORT_PROPERTY,
				environment.getProperty(SERVER_PORT_PROPERTY, DEFAULT_PORT));

		System.out.println(colorizeStartupStatus(createStartupStatus(port, LocalDateTime.now())));
	}

	static String createStartupStatus(String port, LocalDateTime startedAt) {
		return """

				╔══════════════════════════════════════════════════════════════╗
				║              💙 CLOUDIAN BACKEND IS READY 💙                 ║
				╠══════════════════════════════════════════════════════════════╣
				%s
				%s
				%s
				%s
				╚══════════════════════════════════════════════════════════════╝
				""".formatted(
						createStatusRow("Developer ", "Cloudian"),
						createStatusRow("Times ", STARTED_AT_FORMAT.format(startedAt)),
						createStatusRow("API docs ", API_DOCUMENTATION_URL.formatted(port)),
						createStatusRow("PORT", port));
	}

	private static String createStatusRow(String label, String value) {
		return "║  %-12s %-46s ║".formatted(label + ":", value);
	}

	private static String colorizeStartupStatus(String startupStatus) {
		return ANSI_CYAN + startupStatus.replace("💙 CLOUDIAN BACKEND IS READY 💙", ANSI_GREEN
				+ "💙 CLOUDIAN BACKEND IS READY 💙" + ANSI_CYAN) + ANSI_RESET;
	}
}
