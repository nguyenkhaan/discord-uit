# Plan 002: Build a correct, feature-local Kafka demo

> **Executor instructions**: Execute one slice at a time and run its verification before continuing. Preserve unrelated changes. Do not introduce a generic EventBus, outbox, retry/DLT, JSON schema registry, or production notification persistence. Update `plans/README.md` when complete unless a reviewer owns the index.
>
> **Drift check (run first)**: `git diff --stat 8d17716..HEAD -- app/backend/build.gradle app/backend/src/main/java/com/cloudian/backend/configs app/backend/src/main/java/com/cloudian/backend/messagings app/backend/src/main/java/com/cloudian/backend/modules/notification app/backend/src/main/java/com/cloudian/backend/modules/audit app/backend/src/test`
> Also inspect `git status --short` because the Kafka demo files were uncommitted when this plan was written. Before changing an untracked Kafka file, read it in full. Add and verify its replacement, switch the caller, and only then remove the superseded file. If it contains behavior not described below, STOP rather than deleting it.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: `plans/001-restore-backend-verification-baseline.md`
- **Category**: tech-debt
- **Planned at**: commit `8d17716`, 2026-10-09

## Why this matters

The current demo cannot reliably bind its JSON request, has split Kafka configuration, reports success without observing broker acknowledgement, and groups domain behavior in a technical `messagings` package. The target is one small manual-test path—authenticated HTTP request → Kafka topic → Audit consumer—organized by feature and covered by a deterministic embedded-Kafka test. This creates a useful seam without premature interfaces.

## Current state

- `NotificationController.java:13` imports Swagger's `RequestBody`, not Spring MVC's annotation.
- `KafkaEventProducer.publish(topicName, recipientId, message)` leaks the topic into the controller and discards the future returned by `KafkaTemplate.send`.
- `KafkaAuditConsumer` lives in shared `messagings`, prints raw content, and owns no Audit module locality.
- `KafkaConfigConsumer` hard-codes `localhost:9092` while ignored `application.properties` also defines `spring.kafka.*`; the custom listener factory bypasses part of Boot configuration.
- `spring-boot-starter-kafka` and `spring-kafka-test` are already present in the working-tree version of `build.gradle`; ensure exactly one of each remains.
- Project convention is constructor injection; follow `SecurityConfig.java:29-37` rather than field injection.
- Architecture constraints: `docs/documents/architecture.md:7` chooses a modular monolith, and `docs/plan/plan.md:14` requires organization under `com.cloudian.backend.modules` by feature.

## Target module shape

```text
com.cloudian.backend.modules
├── notification
│   ├── NotificationController.java
│   ├── dto/NotificationRequest.java
│   └── messaging
│       ├── KafkaNotificationPublisher.java
│       └── NotificationKafkaConfiguration.java
└── audit
    └── messaging/KafkaAuditConsumer.java
```

Do not add a Java publisher interface yet: there is only one adapter, so it would be a hypothetical seam.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Compile | `cd app/backend && ./gradlew compileJava --no-daemon` | exit 0 |
| Kafka tests | `cd app/backend && ./gradlew test --tests '*KafkaNotification*' --tests '*NotificationController*' --no-daemon` | exit 0; no external broker required |
| Full tests | `cd app/backend && ./gradlew test --no-daemon` | exit 0; no localhost Kafka connection loop in ordinary tests |

## Scope

**In scope**:

- `app/backend/build.gradle`
- Delete `app/backend/src/main/java/com/cloudian/backend/configs/KafkaConfigConsumer.java` if present
- Delete superseded Kafka classes under `app/backend/src/main/java/com/cloudian/backend/messagings/` if present
- `app/backend/src/main/java/com/cloudian/backend/modules/notification/**`
- Create `app/backend/src/main/java/com/cloudian/backend/modules/audit/messaging/KafkaAuditConsumer.java`
- Create focused tests under matching backend test packages
- Create a safe `app/backend/src/main/resources/application.properties.example`
- `app/backend/src/test/java/com/cloudian/backend/exceptions/SecurityExceptionIntegrationTests.java`
- `plans/README.md` (status row only)

**Out of scope**:

- RabbitMQ removal (Plan 003)
- Transactional outbox/database tables
- Socket.IO or frontend notification delivery
- JSON event payloads/schema registry
- Retry, dead-letter topics, observability platform, generic bus interfaces
- JWT implementation or unrelated security cleanup

## Git workflow

- Suggested branch: `advisor/002-feature-local-kafka-demo`
- Commit after each verified slice: request path, Kafka adapter/test, then test isolation/config example.
- Example style: `feat: add feature-local Kafka notification demo`.
- Do not push or open a PR unless instructed.

## Steps

### Step 1: Correct and constrain the HTTP demo boundary

- Use Spring MVC `org.springframework.web.bind.annotation.RequestBody`.
- Add Jakarta validation to `NotificationRequest`: `recipientId` must be nonblank and at most 100 characters; `message` must be nonblank and at most 1,000 characters.
- Add `@Valid` in the controller.
- Put the controller, topic configuration, publisher, and demo Audit listener behind `@ConditionalOnProperty(name = "app.kafka.demo.enabled", havingValue = "true")`; missing/false disables every demo Kafka bean and prevents ordinary tests from initializing Kafka admin/listeners.
- Keep the existing authentication requirement; do not make the route public. Add `spring-security-test` if tests use `@WithMockUser`.
- Standardize the path as `/kafka/notifications`. The publisher returns `CompletableFuture<SendResult<String, String>>`. The controller applies a 10-second timeout and returns `202 {"status":"event accepted"}` after acknowledgement or `503 {"status":"event rejected"}` after send failure/timeout.

**Verify**: add focused MockMvc coverage with the demo enabled: unauthenticated request → 401; authenticated valid JSON → 202 and publisher called with key/message; invalid sizes/blanks → 400; failed publisher future → 503. Run only this test class → pass.

### Step 2: Move the publisher and listener to their owning modules

- Replace generic `KafkaEventProducer` with `KafkaNotificationPublisher` under Notification messaging. The caller must not pass a topic name.
- Publish String key/value for this demo: `recipientId` is the key, message is the value.
- Return/compose `CompletableFuture<SendResult<String, String>>`; do not discard it. Map failure/timeout to the exact 503 response above without exposing broker details.
- Create the topic with one feature-local `NewTopic` bean in `NotificationKafkaConfiguration`; use three partitions and replication factor one for the single-node local demo.
- Move the Audit listener under `modules.audit.messaging`. Give it a distinct, descriptive group id. Log only safe receipt metadata (topic/partition/offset), never raw message content.
- Delete the superseded generic Kafka producer/consumer files.

**Verify**: `./gradlew compileJava --no-daemon` → exit 0.

### Step 3: Make Kafka configuration single-source and environment-friendly

- Delete `KafkaConfigConsumer`; rely on Spring Boot auto-configuration.
- Add `application.properties.example` containing placeholders/local defaults only—never real credentials. Include `spring.kafka.bootstrap-servers=${KAFKA_BOOTSTRAP_SERVERS:localhost:9092}`, String serializers/deserializers, and the explicit demo enable flag defaulting to false.
- Because all demo Kafka beans are conditional and disabled by default, ordinary Spring context tests instantiate no `NewTopic`, listener, or demo publisher. Do not rely only on listener auto-start, which would leave Kafka admin initialization active.

**Verify**: full test suite exits 0 and output contains no attempt to connect to `localhost:9092`.

### Step 4: Prove the transport contract with embedded Kafka

Add one integration test using the existing `spring-kafka-test` dependency and `@EmbeddedKafka`. Publish through `KafkaNotificationPublisher`, consume from the notification topic with a test consumer, and assert:

- topic is correct;
- key equals `recipientId`;
- value equals the submitted message;
- broker acknowledgement completes within a bounded timeout.

Use Kafka test utilities or `CountDownLatch`; do not use arbitrary sleeps. Keep the Audit consumer's business behavior out of this transport test.

**Verify**: focused Kafka tests pass without Docker; then full backend tests pass.

## Test plan

- `NotificationControllerTests`: unauthenticated 401, authenticated valid JSON 202, blank/oversized values 400, and publisher failure/timeout 503.
- `KafkaNotificationPublisherIntegrationTests`: embedded broker topic/key/value/acknowledgement.
- Ordinary context tests: Kafka listener startup disabled so they require no broker.
- Follow existing AssertJ and Spring test conventions visible under `app/backend/src/test/java`.

## Done criteria

- [ ] No Kafka code remains under the shared `messagings` package.
- [ ] No custom `ConsumerFactory` or listener-container factory remains.
- [ ] Controller uses Spring MVC `@RequestBody`, validation, and a disabled-by-default demo flag.
- [ ] HTTP success follows broker acknowledgement; failure is not reported as success.
- [ ] Raw notification content is not logged.
- [ ] Embedded-Kafka contract test passes without Docker.
- [ ] Full backend tests pass without trying to connect to external Kafka.
- [ ] No real credential appears in the new configuration example.
- [ ] `plans/README.md` marks Plan 002 DONE.

## STOP conditions

- Plan 001 is not green.
- Spring Boot 4.1.1 APIs differ from the test/configuration APIs assumed here.
- A second real publisher implementation already exists, making an interface decision non-hypothetical.
- A step requires modifying frontend, database schema, outbox, or Socket.IO code.
- Existing uncommitted Kafka files contain behavior not captured in this plan.

## Maintenance notes

Direct publish is intentionally limited to the demo. When notification persistence is implemented, replace controller-driven publishing with the transactional outbox already described in the architecture documents. At that point, idempotency, retry, and dead-letter strategy become required.
