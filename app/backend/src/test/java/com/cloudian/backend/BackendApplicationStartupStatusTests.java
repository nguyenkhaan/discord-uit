package com.cloudian.backend;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;

class BackendApplicationStartupStatusTests {

	@Test
	void createsAStartupStatusPanelWithConfiguredDetails() {
		String startupStatus = BackendApplication.createStartupStatus(
				"4000", LocalDateTime.of(2026, 9, 14, 10, 30, 0));

		assertThat(startupStatus)
				.contains("Developer ", "Cloudian")
				.contains("Times ", "14/09/2026 10:30:00")
				.contains("API docs ", "http://localhost:4000/api/docs")
				.contains("PORT:", "4000")
				.startsWith("\n╔")
				.endsWith("╚══════════════════════════════════════════════════════════════╝\n");
	}

}
