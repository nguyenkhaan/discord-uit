# Plan 001: Restore a trustworthy backend verification baseline

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving on. Preserve unrelated working-tree changes. If a STOP condition occurs, report it instead of improvising. Update this plan's status in `plans/README.md` when finished unless a reviewer owns the index.
>
> **Drift check (run first)**: `git diff --stat 8d17716..HEAD -- app/backend/src/main/java/com/cloudian/backend/BackendApplication.java app/backend/src/main/java/com/cloudian/backend/exceptions app/backend/src/test/java/com/cloudian/backend`
> Also run `git status --short -- app/backend/src/main/java/com/cloudian/backend/BackendApplication.java app/backend/src/main/java/com/cloudian/backend/exceptions app/backend/src/test/java/com/cloudian/backend` because this plan was written while unrelated work was uncommitted. Compare live code with the excerpts below before editing.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `8d17716`, 2026-10-09

## Why this matters

`./gradlew test --no-daemon` currently compiles but fails 3 of 10 tests before any Kafka refactor is applied. Incremental Kafka work needs a green baseline so each later slice can distinguish a regression from pre-existing drift. This plan repairs only the verified test/implementation mismatches; it does not change Kafka, RabbitMQ, authentication, or frontend code.

## Current state

- `BackendApplicationStartupStatusTests.java:15-21` expects adjacent label/value substrings, while `BackendApplication.createStatusRow()` intentionally pads columns inside a status panel.
- `ErrorResponseWriterTests.java:25-31` and `GlobalErrorAttributesTests.java:23-25` define the current shared error shape as `message`, `status`, and `timestamp`.
- `ErrorResponse.java:9,17-18,34-35` adds an unrelated `notification` field, and `ErrorResponseWriter.java:25-30` serializes it. This conflicts with the tests and with the shared-error work described in `docs/plan/plan.md:15-16`.
- Baseline command observed on 2026-10-09: `10 tests completed, 3 failed`.

Relevant excerpts:

```java
// BackendApplication.java:56-57
private static String createStatusRow(String label, String value) {
    return "║  %-12s %-46s ║".formatted(label + ":", value);
}
```

```java
// ErrorResponse.java:9
public record ErrorResponse(String message, int status, Instant timestamp, String notification) {
```

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Focused tests | `cd app/backend && ./gradlew test --tests '*BackendApplicationStartupStatusTests' --tests '*ErrorResponseWriterTests' --tests '*GlobalErrorAttributesTests' --no-daemon` | exit 0; 3 test classes pass |
| Full tests | `cd app/backend && ./gradlew test --no-daemon` | exit 0; all tests pass |

## Scope

**In scope**:

- `app/backend/src/main/java/com/cloudian/backend/exceptions/ErrorResponse.java`
- `app/backend/src/main/java/com/cloudian/backend/exceptions/ErrorResponseWriter.java`
- `app/backend/src/test/java/com/cloudian/backend/BackendApplicationStartupStatusTests.java`
- `app/backend/src/test/java/com/cloudian/backend/BackendApplicationTests.java`
- Existing error-response tests only if an assertion needs to be made more explicit without changing the three-field contract
- `plans/README.md` (status row only)

**Out of scope**:

- Kafka and RabbitMQ source/configuration
- `BackendApplication.java` status-panel formatting
- Adding new error-response fields such as `code` or `path`
- Frontend files and authentication behavior

## Git workflow

- Suggested branch: `advisor/001-restore-backend-verification`
- Keep one focused commit, e.g. `fix: restore backend test baseline`.
- Do not push or open a PR unless instructed.

## Steps

### Step 1: Restore the documented three-field error contract

Remove the `notification` member from `ErrorResponse`, its hard-coded construction value, its map entry, and its manual JSON serialization. Keep `message`, `status`, and `timestamp` behavior unchanged. Do not add the future `code` and `path` fields in this prerequisite slice.

**Verify**: run the focused error tests → both error test classes pass.

### Step 2: Make the startup test assert content rather than spacing

Keep the aligned status panel implementation. Change `BackendApplicationStartupStatusTests` so it independently asserts the expected labels and values instead of requiring a single-space adjacency that the panel does not promise. Continue asserting the border and configured port/time values.

**Verify**: run the full focused command → all three test classes pass.

### Step 3: Isolate the context smoke test from local datasource configuration

The clean worktree has no ignored `application.properties`, so `BackendApplicationTests.contextLoads()` currently fails while creating a datasource. Match the existing isolation pattern in `SecurityExceptionIntegrationTests`: exclude `DataSourceAutoConfiguration` through `@SpringBootTest(properties = ...)` and provide a `@MockitoBean JdbcTemplate` because `HealthController` requires it. Do not add credentials or a test database merely to satisfy a context smoke test.

**Verify**: `cd app/backend && ./gradlew test --tests '*BackendApplicationTests' --no-daemon` → exit 0.

### Step 4: Establish the baseline

Run the full backend suite once. Kafka/Rabbit connection warnings may still appear at this stage, but they must not fail tests; Plan 002 removes those external-broker attempts from ordinary tests.

**Verify**: `cd app/backend && ./gradlew test --no-daemon` → exit 0.

## Test plan

- No new test class is required.
- Preserve the existing semantic assertions for HTTP error JSON.
- Preserve status-panel value and border assertions while decoupling them from column padding.

## Done criteria

- [ ] The shared error response contains exactly `message`, `status`, and `timestamp`.
- [ ] All three previously failing test classes pass.
- [ ] `BackendApplicationTests` passes without a local datasource URL or credential.
- [ ] `./gradlew test --no-daemon` exits 0.
- [ ] No Kafka/Rabbit/frontend/authentication file is modified.
- [ ] `plans/README.md` marks Plan 001 DONE.

## STOP conditions

- The team explicitly requires the `notification` error field as a public contract.
- Any in-scope source differs materially from the excerpts due to newer work.
- Full tests reveal a new failure beyond the three recorded assertion failures and the now-recorded datasource isolation failure.
- Repair appears to require changing Kafka, RabbitMQ, database connectivity, or frontend code.

## Maintenance notes

The plan intentionally does not implement the future error contract described in the project plan. That should be a separate contract-first change with OpenAPI and frontend coordination.
