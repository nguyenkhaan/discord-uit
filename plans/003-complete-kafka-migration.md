# Plan 003: Complete the RabbitMQ-to-Kafka migration and align project documentation

> **Executor instructions**: Execute removal and verification in small slices. Preserve unrelated working-tree changes, especially frontend work. Do not implement outbox, Socket.IO, retry/DLT, or production clustering in this plan. Update `plans/README.md` when complete unless a reviewer owns the index.
>
> **Drift check (run first)**: `git diff --stat 8d17716..HEAD -- app/backend/build.gradle app/backend/src/main/java/com/cloudian/backend/configs app/backend/src/main/java/com/cloudian/backend/messagings app/backend/src/main/java/com/cloudian/backend/modules/health app/backend/compose.yaml docker-compose.yaml README.md app/backend/HELP.md docs`
> Also run `git status --short` because this migration was planned against an uncommitted Kafka demo.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/002-build-feature-local-kafka-demo.md`
- **Category**: migration
- **Planned at**: commit `8d17716`, 2026-10-09

## Why this matters

RabbitMQ remains an active dependency, listener system, endpoint, Compose service, and documented architectural choice even though Kafka is now the selected bus. Running both makes startup/test behavior ambiguous and invites future features onto the wrong transport. This plan leaves Kafka as the sole internal event broker while retaining Socket.IO as the future browser realtime adapter.

## Current state

- `build.gradle` contains AMQP runtime/test starters alongside Kafka starters.
- `RabbitMQConfig`, `RabbitMQProducer`, and `RabbitMQConsumer` are active Spring beans; `//Deprecated` comments do not disable them.
- `HealthController` injects `RabbitMQProducer` and exposes `/health/rabbitmq`.
- Both Compose files still provision RabbitMQ; root Compose also has a Kafka broker and a separate mismatched-version Kafka init image.
- `README.md`, `app/backend/HELP.md`, and six locations in `docs/plan/plan.md` still select RabbitMQ.
- `docs/documents/architecture.md:81-83` requires transactional outbox before real business-event delivery. That decision remains; only the transport changes to Kafka.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Find old broker | `rg -ni 'rabbitmq|amqp' README.md app/backend docs/plan docs/documents docker-compose.yaml` | exit 1; no active references (ADR history is outside this path set) |
| Compose validate | `docker compose -f docker-compose.yaml config --quiet` | exit 0 |
| Compile | `cd app/backend && ./gradlew compileJava --no-daemon` | exit 0 |
| Tests | `cd app/backend && ./gradlew test --no-daemon` | exit 0 |
| Build | `cd app/backend && ./gradlew build --no-daemon` | exit 0 |

## Scope

**In scope**:

- `app/backend/build.gradle`
- Delete `RabbitMQConfig.java`, `RabbitMQProducer.java`, and `RabbitMQConsumer.java`
- `app/backend/src/main/java/com/cloudian/backend/modules/health/HealthController.java`
- `docker-compose.yaml`
- `app/backend/compose.yaml` (consolidate/delete as described below)
- `README.md`
- `app/backend/HELP.md`
- `app/backend/src/main/resources/application.properties.example`
- `docs/documents/architecture.md`
- `docs/plan/plan.md`
- Create `docs/adr/0001-use-kafka-as-event-bus.md`
- `app/backend/src/test/java/com/cloudian/backend/exceptions/SecurityExceptionIntegrationTests.java`
- `plans/README.md` (status row only)

**Out of scope**:

- Notification database persistence and transactional outbox implementation
- Socket.IO gateway implementation
- Kafka authentication/TLS, multi-broker production topology, retry/DLT
- Frontend code
- JWT/credential remediation

## Git workflow

- Suggested branch: `advisor/003-complete-kafka-migration`
- Use separate commits for runtime removal, Compose consolidation, and docs/ADR.
- Suggested messages: `refactor: remove RabbitMQ transport`, `docs: adopt Kafka event bus`.
- Do not push or open a PR unless instructed.

## Steps

### Step 1: Remove RabbitMQ runtime paths

- Remove AMQP implementation and test dependencies from `build.gradle`.
- Delete the RabbitMQ config/producer/consumer classes.
- Remove the RabbitMQ field, import, and `/health/rabbitmq` handler from `HealthController`; do not replace it with a state-changing Kafka health endpoint. The manual Kafka endpoint from Plan 002 is the demo path.
- Remove RabbitMQ properties from safe configuration examples. Do not print or copy any local secret value.

**Verify**: compile and run `rg` over Java/build files → no AMQP/Rabbit code remains.

### Step 2: Establish one canonical local Compose topology

- Make root `docker-compose.yaml` the documented canonical topology.
- Before deleting the backend-local topology, run `docker compose -f app/backend/compose.yaml ps`. If PostgreSQL is running or its container data must be preserved, STOP and ask the operator to export or explicitly discard it; never run `down -v`.
- Preserve mailpit/minio. Move PostgreSQL to root Compose using `postgres:16`, host mapping `5432:5432`, the local-only database/user names already present in the backend Compose file, password environment interpolation, and named volume `postgres-data:/var/lib/postgresql/data`. Never copy a credential from ignored application configuration.
- Retain `apache/kafka:4.3.1` with host mapping `9092:9092`, and remove RabbitMQ and its volume.
- Remove `kafka-init`; Plan 002's `NewTopic` bean owns topic creation, eliminating the mismatched CLI image.
- Delete `app/backend/compose.yaml` after PostgreSQL and Kafka are represented in root Compose. Confirm Spring Boot no longer auto-starts a conflicting colocated topology.

**Verify**: `docker compose -f docker-compose.yaml config --quiet` → exit 0; `docker compose -f docker-compose.yaml config --services` prints `postgres` and `kafka` once each and no RabbitMQ service.

### Step 3: Record the architecture decision

Create `docs/adr/0001-use-kafka-as-event-bus.md` with status Accepted and date 2026-10-09. Record:

- modular monolith remains the application shape;
- Kafka replaces RabbitMQ as the internal durable event bus/job stream;
- Socket.IO remains the authorized realtime adapter to browsers;
- the direct HTTP publisher is a local/manual demo only;
- real persisted state changes must later publish through transactional outbox;
- consumer groups provide per-module fan-out and same-group load sharing;
- single-node PLAINTEXT Compose is local-only.

Do not claim exactly-once business processing.

**Verify**: ADR exists and contains all seven decisions above.

### Step 4: Align README, architecture, plan, and generated help

- Replace RabbitMQ badge/setup/runtime references with Kafka.
- Document the exact local manual-test order: start Kafka, run backend with demo enabled, obtain/use JWT, POST notification JSON, observe Audit receipt metadata, inspect topic with Kafka CLI, stop services.
- Update `docs/plan/plan.md` RabbitMQ references to Kafka while preserving the outbox and Socket.IO responsibilities.
- Update `docs/documents/architecture.md` to name Kafka under supporting infrastructure and event delivery.
- Remove stale RabbitMQ entries from `app/backend/HELP.md`; do not hand-edit unrelated generated sections.

**Verify**: the exact old-broker `rg` command in the command table exits 1. Separately inspect the ADR to confirm its historical replacement statement is intentional. Docs clearly distinguish Kafka internal delivery from Socket.IO browser delivery.

### Step 5: Final gates

Run Compose validation, backend tests, and backend build once after the final code/docs change.

**Verify**: all commands in the table exit 0.

## Test plan

- Existing Plan 002 Kafka tests remain green after AMQP removal.
- Extend `SecurityExceptionIntegrationTests` to prove retained `/health/message` stays 200 and removed `/health/rabbitmq` returns 404.
- No new test is required solely for deleting unused Rabbit classes.
- README contains a manual smoke-test checklist for the operator; automated embedded-Kafka tests remain the executor's reproducible gate.

## Done criteria

- [ ] No RabbitMQ/AMQP dependency, Spring bean, endpoint, Compose service, or active documentation remains.
- [ ] Exactly one canonical local Compose file is documented and validates.
- [ ] Kafka broker uses one pinned image; topic creation is application-owned.
- [ ] ADR records Kafka replacement and deferred outbox boundary.
- [ ] README manual test is reproducible without tribal knowledge.
- [ ] `./gradlew test --no-daemon` and `./gradlew build --no-daemon` exit 0.
- [ ] No frontend or credential file is modified.
- [ ] `plans/README.md` marks Plan 003 DONE.

## STOP conditions

- Repository-wide search finds a RabbitMQ caller beyond the documented health demo.
- Moving PostgreSQL to root Compose would overwrite user data or conflict with an established external workflow.
- Kafka demo tests from Plan 002 are not green.
- Migration requires implementing outbox/Socket.IO to keep existing behavior.

## Maintenance notes

The next reliability milestone is transactional outbox plus idempotent consumers. Do not add retries/DLT independently before defining event identity and processing semantics. Production Kafka must add authentication, encryption, monitoring, retention policy, and a multi-broker availability design; those are intentionally absent from this local demo.
