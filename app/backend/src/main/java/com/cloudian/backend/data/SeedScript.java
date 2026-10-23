package com.cloudian.backend.data;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.WebApplicationType;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.cloudian.backend.BackendApplication;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@Component
public class SeedScript {

    private static final Logger LOGGER = LoggerFactory.getLogger(SeedScript.class);
    private static final Path SEED_DATA_PATH = Path.of(
            "src/main/java/com/cloudian/backend/data/data.json");
    private static final JsonMapper JSON_MAPPER = JsonMapper.builder().build();
    private static final Pattern SQL_IDENTIFIER = Pattern.compile("[a-z][a-z0-9_]*");

    private static final Set<String> MODELED_TABLES = Set.of(
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

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;

    SeedScript(
            NamedParameterJdbcTemplate jdbcTemplate,
            PasswordEncoder passwordEncoder) {
        this.jdbcTemplate = jdbcTemplate;
        this.passwordEncoder = passwordEncoder;
    }

    public static void main(String[] args) {
        SpringApplication application = createSeedApplication();

        try (ConfigurableApplicationContext context = application.run(args)) {
            SeedSummary summary = context.getBean(SeedScript.class).seedDatabase();
            LOGGER.info(
                    "Database seed completed: {} inserted, {} skipped",
                    summary.inserted(),
                    summary.skipped());
        }
    }

    static SpringApplication createSeedApplication() {
        SpringApplication application = new SpringApplication(BackendApplication.class);
        application.setWebApplicationType(WebApplicationType.SERVLET);
        application.setDefaultProperties(Map.of(
                "spring.kafka.listener.auto-startup", "false",
                "spring.main.banner-mode", "off",
                "spring.devtools.restart.enabled", "false",
                "server.port", "0"));
        return application;
    }

    @Transactional
    public SeedSummary seedDatabase() {
        return seed(readSeedData(SEED_DATA_PATH, JSON_MAPPER));
    }

    SeedSummary seed(SeedData seedData) {
        Map<String, Object> references = new LinkedHashMap<>();
        int inserted = 0;
        int skipped = 0;

        for (TableSeed table : seedData.tables()) {
            for (Map<String, JsonNode> row : table.rows()) {
                ResolvedRow resolvedRow = resolveRow(row, references, seedData.defaultPassword());
                Object existingReference = findExisting(table, resolvedRow);
                if (existingReference != null) {
                    registerReference(table, row, resolvedRow, existingReference, references);
                    skipped++;
                    continue;
                }

                int affectedRows = insert(table, resolvedRow);
                if (affectedRows == 1) {
                    registerReference(table, row, resolvedRow, null, references);
                    inserted++;
                    continue;
                }

                Object concurrentReference = findExisting(table, resolvedRow);
                if (concurrentReference == null) {
                    throw new IllegalStateException(
                            "Seed insert conflicted outside configured keys for table " + table.name());
                }
                registerReference(table, row, resolvedRow, concurrentReference, references);
                skipped++;
            }
        }

        return new SeedSummary(inserted, skipped);
    }

    static SeedData readSeedData(Path path, JsonMapper jsonMapper) {
        try (var input = Files.newInputStream(path)) {
            SeedData seedData = jsonMapper.readerFor(SeedData.class).readValue(input);
            validate(seedData);
            return seedData;
        } catch (IOException exception) {
            throw new IllegalStateException("Cannot read seed data from " + path, exception);
        }
    }

    private static void validate(SeedData seedData) {
        if (seedData == null || seedData.defaultPassword() == null
                || seedData.defaultPassword().isBlank()) {
            throw new IllegalArgumentException("Seed data must define a default password");
        }
        if (seedData.tables() == null) {
            throw new IllegalArgumentException("Seed data must define tables");
        }

        Set<String> tableNames = new HashSet<>();
        Set<String> references = new HashSet<>();
        for (TableSeed table : seedData.tables()) {
            validateTable(table, tableNames, references);
        }

        if (!tableNames.equals(MODELED_TABLES)) {
            Set<String> missing = new HashSet<>(MODELED_TABLES);
            missing.removeAll(tableNames);
            Set<String> unknown = new HashSet<>(tableNames);
            unknown.removeAll(MODELED_TABLES);
            throw new IllegalArgumentException(
                    "Seed table coverage mismatch; missing=" + missing + ", unknown=" + unknown);
        }
    }

    private static void validateTable(
            TableSeed table,
            Set<String> tableNames,
            Set<String> references) {
        requireIdentifier(table.name(), "table name");
        if (!tableNames.add(table.name())) {
            throw new IllegalArgumentException("Duplicate seed table: " + table.name());
        }
        if (table.keyColumns() == null || table.keyColumns().isEmpty()) {
            throw new IllegalArgumentException("Missing keyColumns for table " + table.name());
        }
        table.keyColumns().forEach(column -> requireIdentifier(column, "key column"));
        if (table.referenceColumn() != null) {
            requireIdentifier(table.referenceColumn(), "reference column");
        }
        if (table.rows() == null || table.rows().isEmpty()) {
            throw new IllegalArgumentException("Missing rows for table " + table.name());
        }

        for (Map<String, JsonNode> row : table.rows()) {
            table.keyColumns().forEach(column -> {
                if (!row.containsKey(column)) {
                    throw new IllegalArgumentException(
                            "Missing key column " + column + " in table " + table.name());
                }
            });
            row.keySet().stream()
                    .filter(column -> !column.equals("_ref"))
                    .forEach(column -> requireIdentifier(column, "column"));

            row.entrySet().stream()
                    .filter(entry -> !entry.getKey().equals("_ref"))
                    .forEach(entry -> validateSeedValue(entry.getValue(), references));

            JsonNode reference = row.get("_ref");
            if (reference != null) {
                if (!reference.isString() || reference.stringValue().isBlank()) {
                    throw new IllegalArgumentException("Seed reference must be a non-blank string");
                }
                if (table.referenceColumn() == null || !row.containsKey(table.referenceColumn())) {
                    throw new IllegalArgumentException(
                            "Seed reference requires referenceColumn in table " + table.name());
                }
                if (!references.add(reference.stringValue())) {
                    throw new IllegalArgumentException("Duplicate seed reference: " + reference.stringValue());
                }
            }
        }
    }

    private static void validateSeedValue(JsonNode value, Set<String> availableReferences) {
        if (!value.isObject()) {
            if (value.isArray()) {
                throw new IllegalArgumentException("Seed arrays must use the $textArray marker");
            }
            return;
        }
        if (value.properties().size() != 1) {
            throw new IllegalArgumentException("Seed value markers must contain exactly one property");
        }

        Map.Entry<String, JsonNode> marker = value.properties().iterator().next();
        switch (marker.getKey()) {
            case "$uuid" -> UUID.fromString(marker.getValue().stringValue());
            case "$instant" -> Instant.parse(marker.getValue().stringValue());
            case "$ref" -> {
                if (!availableReferences.contains(marker.getValue().stringValue())) {
                    throw new IllegalArgumentException(
                            "Seed reference is used before declaration: " + marker.getValue().stringValue());
                }
            }
            case "$json" -> validateJsonValue(marker.getValue(), availableReferences);
            case "$textArray" -> validateTextArray(marker.getValue());
            case "$defaultPassword" -> {
                if (!marker.getValue().isBoolean() || !marker.getValue().booleanValue()) {
                    throw new IllegalArgumentException("$defaultPassword marker must be true");
                }
            }
            default -> throw new IllegalArgumentException("Unknown seed marker: " + marker.getKey());
        }
    }

    private static void validateTextArray(JsonNode value) {
        if (!value.isArray()) {
            throw new IllegalArgumentException("$textArray marker must contain an array");
        }
        value.forEach(item -> {
            if (!item.isString()) {
                throw new IllegalArgumentException("$textArray items must be strings");
            }
        });
    }

    private static void validateJsonValue(JsonNode value, Set<String> availableReferences) {
        if (isEmbeddedReference(value)) {
            JsonNode reference = value.get("$ref");
            if (!reference.isString() || !availableReferences.contains(reference.stringValue())) {
                throw new IllegalArgumentException(
                        "Embedded JSON reference is unavailable: " + reference.stringValue());
            }
            return;
        }
        if (value.isObject()) {
            value.properties().forEach(entry -> validateJsonValue(entry.getValue(), availableReferences));
        } else if (value.isArray()) {
            value.forEach(item -> validateJsonValue(item, availableReferences));
        }
    }

    private ResolvedRow resolveRow(
            Map<String, JsonNode> row,
            Map<String, Object> references,
            String defaultPassword) {
        Map<String, SeedValue> values = new LinkedHashMap<>();
        row.forEach((column, value) -> {
            if (!column.equals("_ref")) {
                values.put(column, resolveValue(value, references, defaultPassword));
            }
        });
        return new ResolvedRow(values);
    }

    private SeedValue resolveValue(
            JsonNode value,
            Map<String, Object> references,
            String defaultPassword) {
        if (value.isNull()) {
            return new SeedValue(null, null);
        }
        if (value.isString()) {
            return new SeedValue(value.stringValue(), null);
        }
        if (value.isBoolean()) {
            return new SeedValue(value.booleanValue(), null);
        }
        if (value.isNumber()) {
            return new SeedValue(value.numberValue(), null);
        }

        Map.Entry<String, JsonNode> marker = value.properties().iterator().next();
        return switch (marker.getKey()) {
            case "$uuid" -> new SeedValue(UUID.fromString(marker.getValue().stringValue()), null);
            case "$instant" -> new SeedValue(
                    Timestamp.from(Instant.parse(marker.getValue().stringValue())),
                    null);
            case "$ref" -> new SeedValue(
                    requireResolvedReference(marker.getValue().stringValue(), references),
                    null);
            case "$json" -> new SeedValue(
                    writeJson(marker.getValue(), references),
                    "json");
            case "$textArray" -> new SeedValue(toPostgresTextArray(marker.getValue()), "text[]");
            case "$defaultPassword" -> new SeedValue(passwordEncoder.encode(defaultPassword), null);
            default -> throw new IllegalArgumentException("Unknown seed marker: " + marker.getKey());
        };
    }

    private static Object requireResolvedReference(
            String reference,
            Map<String, Object> references) {
        Object value = references.get(reference);
        if (value == null) {
            throw new IllegalStateException("Unresolved seed reference: " + reference);
        }
        return value;
    }

    private static String writeJson(JsonNode value, Map<String, Object> references) {
        try {
            return JSON_MAPPER.writeValueAsString(resolveJsonValue(value, references));
        } catch (JacksonException exception) {
            throw new IllegalArgumentException("Cannot serialize seed JSON value", exception);
        }
    }

    private static Object resolveJsonValue(JsonNode value, Map<String, Object> references) {
        if (isEmbeddedReference(value)) {
            return requireResolvedReference(value.get("$ref").stringValue(), references);
        }
        if (value.isObject()) {
            Map<String, Object> object = new LinkedHashMap<>();
            value.properties().forEach(entry -> object.put(
                    entry.getKey(),
                    resolveJsonValue(entry.getValue(), references)));
            return object;
        }
        if (value.isArray()) {
            List<Object> array = new ArrayList<>();
            value.forEach(item -> array.add(resolveJsonValue(item, references)));
            return array;
        }
        if (value.isString()) {
            return value.stringValue();
        }
        if (value.isNumber()) {
            return value.numberValue();
        }
        if (value.isBoolean()) {
            return value.booleanValue();
        }
        return null;
    }

    private static boolean isEmbeddedReference(JsonNode value) {
        return value.isObject() && value.properties().size() == 1 && value.has("$ref");
    }

    private static String toPostgresTextArray(JsonNode value) {
        String elements = value.valueStream()
                .map(JsonNode::stringValue)
                .map(SeedScript::quotePostgresArrayElement)
                .collect(Collectors.joining(","));
        return "{" + elements + "}";
    }

    private static String quotePostgresArrayElement(String value) {
        return "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }

    private Object findExisting(TableSeed table, ResolvedRow row) {
        Map<String, Object> parameters = new LinkedHashMap<>();
        String predicates = buildPredicates(table, row, parameters);
        String selectedColumn = table.referenceColumn() == null
                ? "1"
                : table.referenceColumn();
        String sql = "SELECT " + selectedColumn + " AS seed_reference FROM " + table.name()
                + " WHERE " + predicates + " LIMIT 1";
        return jdbcTemplate.query(
                sql,
                parameters,
                resultSet -> resultSet.next() ? resultSet.getObject("seed_reference") : null);
    }

    private static String buildPredicates(
            TableSeed table,
            ResolvedRow row,
            Map<String, Object> parameters) {
        List<String> predicates = new ArrayList<>();
        for (int index = 0; index < table.keyColumns().size(); index++) {
            String column = table.keyColumns().get(index);
            String parameterName = "key" + index;
            SeedValue value = row.values().get(column);
            parameters.put(parameterName, value.parameterValue());
            predicates.add(column + " = " + value.placeholder(parameterName));
        }
        return String.join(" AND ", predicates);
    }

    private int insert(TableSeed table, ResolvedRow row) {
        Map<String, Object> parameters = new LinkedHashMap<>();
        List<String> columns = List.copyOf(row.values().keySet());
        List<String> placeholders = new ArrayList<>();

        for (int index = 0; index < columns.size(); index++) {
            String parameterName = "value" + index;
            SeedValue value = row.values().get(columns.get(index));
            parameters.put(parameterName, value.parameterValue());
            placeholders.add(value.placeholder(parameterName));
        }

        String sql = "INSERT INTO " + table.name()
                + " (" + String.join(", ", columns) + ") VALUES ("
                + String.join(", ", placeholders) + ") ON CONFLICT DO NOTHING";
        return jdbcTemplate.update(sql, parameters);
    }

    private static void registerReference(
            TableSeed table,
            Map<String, JsonNode> sourceRow,
            ResolvedRow resolvedRow,
            Object existingReference,
            Map<String, Object> references) {
        JsonNode alias = sourceRow.get("_ref");
        if (alias == null) {
            return;
        }
        Object referenceValue = existingReference != null
                ? existingReference
                : resolvedRow.values().get(table.referenceColumn()).parameterValue();
        references.put(alias.stringValue(), referenceValue);
    }

    private static void requireIdentifier(String value, String label) {
        if (value == null || !SQL_IDENTIFIER.matcher(value).matches()) {
            throw new IllegalArgumentException("Invalid " + label + ": " + value);
        }
    }

    record SeedData(String defaultPassword, List<TableSeed> tables) {
    }

    record TableSeed(
            String name,
            List<String> keyColumns,
            String referenceColumn,
            List<Map<String, JsonNode>> rows) {
    }

    record SeedSummary(int inserted, int skipped) {
    }

    private record ResolvedRow(Map<String, SeedValue> values) {
    }

    private record SeedValue(Object parameterValue, String sqlType) {

        String placeholder(String parameterName) {
            if (sqlType == null) {
                return ":" + parameterName;
            }
            return "CAST(:" + parameterName + " AS " + sqlType + ")";
        }
    }
}
