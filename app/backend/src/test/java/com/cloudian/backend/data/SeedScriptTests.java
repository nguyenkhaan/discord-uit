package com.cloudian.backend.data;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.nio.file.Path;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.boot.WebApplicationType;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import tools.jackson.databind.json.JsonMapper;

class SeedScriptTests {

    private static final Path SEED_DATA_PATH = Path.of(
            "src/main/java/com/cloudian/backend/data/data.json");

    private static final Set<String> EXPECTED_TABLES = Set.of(
            "agent_classification",
            "agent_classification_category",
            "agent_classification_collection",
            "anonymous_alias",
            "audit_log",
            "call_event",
            "call_participation",
            "call_session",
            "category",
            "chat_message",
            "collection",
            "collection_category",
            "comment",
            "comment_reaction",
            "document",
            "document_category",
            "document_collection",
            "document_submission",
            "forum_post",
            "media",
            "message_reaction",
            "notification",
            "outbox_event",
            "post_reaction",
            "react_icon",
            "refresh_session",
            "report",
            "report_evidence",
            "server",
            "server_invite",
            "server_membership",
            "user_account");

    private final JsonMapper jsonMapper = JsonMapper.builder().build();

    @Test
    void seedRunnerUsesServletContextRequiredBySecurityConfiguration() {
        assertThat(SeedScript.createSeedApplication().getWebApplicationType())
                .isEqualTo(WebApplicationType.SERVLET);
    }

    @Test
    void seedDataCoversEveryEntityTableWithExpectedRowCounts() {
        SeedScript.SeedData seedData = SeedScript.readSeedData(SEED_DATA_PATH, jsonMapper);

        assertThat(seedData.tables())
                .extracting(SeedScript.TableSeed::name)
                .containsExactlyInAnyOrderElementsOf(EXPECTED_TABLES);

        assertThat(seedData.tables())
                .filteredOn(table -> !table.name().equals("user_account"))
                .allSatisfy(table -> assertThat(table.rows())
                        .as("rows in table %s", table.name())
                        .hasSizeBetween(3, 4));
    }

    @Test
    void seedDataProvidesOneLoginAccountForEverySystemRole() {
        SeedScript.SeedData seedData = SeedScript.readSeedData(SEED_DATA_PATH, jsonMapper);
        SeedScript.TableSeed users = seedData.tables().stream()
                .filter(table -> table.name().equals("user_account"))
                .findFirst()
                .orElseThrow();

        Set<String> roles = users.rows().stream()
                .map(row -> row.get("system_role").stringValue())
                .collect(Collectors.toSet());
        Set<String> emails = users.rows().stream()
                .map(row -> row.get("email").stringValue())
                .collect(Collectors.toSet());

        assertThat(users.rows()).hasSize(2);
        assertThat(roles).containsExactlyInAnyOrder("USER", "ADMIN");
        assertThat(emails).containsExactlyInAnyOrder("user@gmail.com", "admin@gmail.com");
        assertThat(seedData.defaultPassword()).isEqualTo("cloudian");
    }

    @Test
    void insertsEveryMissingRowUsingParameterizedStatements() {
        NamedParameterJdbcTemplate jdbcTemplate = mock(NamedParameterJdbcTemplate.class);
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
        SeedScript seedScript = new SeedScript(jdbcTemplate, passwordEncoder);
        SeedScript.SeedData seedData = SeedScript.readSeedData(SEED_DATA_PATH, jsonMapper);
        int expectedRowCount = seedData.tables().stream()
                .mapToInt(table -> table.rows().size())
                .sum();

        when(jdbcTemplate.query(
                anyString(),
                anyMap(),
                org.mockito.ArgumentMatchers.<ResultSetExtractor<Object>>any()))
                .thenReturn(null);
        when(jdbcTemplate.update(anyString(), anyMap())).thenReturn(1);
        when(passwordEncoder.encode("cloudian")).thenReturn("bcrypt-cloudian");

        SeedScript.SeedSummary summary = seedScript.seed(seedData);

        assertThat(summary.inserted()).isEqualTo(expectedRowCount);
        assertThat(summary.skipped()).isZero();
        verify(jdbcTemplate, times(expectedRowCount)).update(anyString(), anyMap());

        @SuppressWarnings({"rawtypes", "unchecked"})
        ArgumentCaptor<Map<String, ?>> parameters = (ArgumentCaptor) ArgumentCaptor.forClass(Map.class);
        verify(jdbcTemplate, times(expectedRowCount)).update(anyString(), parameters.capture());
        Map<String, ?> userParameters = parameters.getAllValues().stream()
                .filter(values -> values.containsValue("user@gmail.com"))
                .findFirst()
                .orElseThrow();
        assertThat(userParameters.containsValue("bcrypt-cloudian")).isTrue();
        assertThat(userParameters.containsValue("cloudian")).isFalse();
    }

    @Test
    void skipsExistingRowsWithoutIssuingInserts() {
        NamedParameterJdbcTemplate jdbcTemplate = mock(NamedParameterJdbcTemplate.class);
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
        SeedScript seedScript = new SeedScript(jdbcTemplate, passwordEncoder);
        SeedScript.SeedData seedData = SeedScript.readSeedData(SEED_DATA_PATH, jsonMapper);
        int expectedRowCount = seedData.tables().stream()
                .mapToInt(table -> table.rows().size())
                .sum();

        when(jdbcTemplate.query(
                anyString(),
                anyMap(),
                org.mockito.ArgumentMatchers.<ResultSetExtractor<Object>>any()))
                .thenReturn(UUID.fromString("00000000-0000-0000-0000-000000009999"));

        SeedScript.SeedSummary summary = seedScript.seed(seedData);

        assertThat(summary.inserted()).isZero();
        assertThat(summary.skipped()).isEqualTo(expectedRowCount);
        verify(jdbcTemplate, never()).update(anyString(), anyMap());
    }

    @Test
    void resolvesExistingNaturalKeyIdsInsideJsonPayloads() {
        NamedParameterJdbcTemplate jdbcTemplate = mock(NamedParameterJdbcTemplate.class);
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
        SeedScript seedScript = new SeedScript(jdbcTemplate, passwordEncoder);
        SeedScript.SeedData seedData = SeedScript.readSeedData(SEED_DATA_PATH, jsonMapper);
        UUID existingUserId = UUID.fromString("00000000-0000-0000-0000-000000009001");
        UUID existingAdminId = UUID.fromString("00000000-0000-0000-0000-000000009002");

        when(jdbcTemplate.query(
                anyString(),
                anyMap(),
                org.mockito.ArgumentMatchers.<ResultSetExtractor<Object>>any()))
                .thenAnswer(invocation -> {
                    String sql = invocation.getArgument(0);
                    Map<?, ?> parameters = invocation.getArgument(1);
                    if (!sql.contains("FROM user_account")) {
                        return null;
                    }
                    return parameters.containsValue("user@gmail.com")
                            ? existingUserId
                            : existingAdminId;
                });
        when(jdbcTemplate.update(anyString(), anyMap())).thenReturn(1);

        seedScript.seed(seedData);

        @SuppressWarnings({"rawtypes", "unchecked"})
        ArgumentCaptor<Map<String, ?>> parameters = (ArgumentCaptor) ArgumentCaptor.forClass(Map.class);
        verify(jdbcTemplate, times(98)).update(anyString(), parameters.capture());
        String notificationPayload = parameters.getAllValues().stream()
                .flatMap(values -> values.values().stream())
                .filter(String.class::isInstance)
                .map(String.class::cast)
                .filter(value -> value.contains("notificationId"))
                .findFirst()
                .orElseThrow();

        assertThat(notificationPayload).contains(existingUserId.toString());
    }
}
