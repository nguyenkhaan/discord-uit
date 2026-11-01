# Server Status Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persisted server lifecycle status with `ACTIVE` as the default and apply the schema change to the configured Supabase database.

**Architecture:** Store the lifecycle as a Java enum persisted by JPA as a constrained PostgreSQL string column. A transactional SQL migration backfills existing rows to `ACTIVE`, then sets the default and validation constraint; it is executed once against the configured remote datasource. Existing `deleted_at` remains an independent soft-delete signal.

**Tech Stack:** Java 17, Spring Data JPA, PostgreSQL/Supabase, JUnit 5, Docker PostgreSQL client.

**Spec:** User request in this conversation dated 2026-11-02.

## Global Constraints

- The only persisted lifecycle values are `ACTIVE`, `LOCKED`, and `CLOSED`.
- A newly created `Server` defaults to `ACTIVE` in Java and PostgreSQL.
- `deleted_at` remains unchanged and independent from `status`.
- Existing CLOSED-server members retain read access; enforcement APIs are proposed only, not implemented.
- Do not implement a soft-delete API in this change.

## Review Focus

- Existing rows must be backfilled before `NOT NULL` is enforced.
- Database writes outside JPA must receive the same `ACTIVE` default and validation.
- The remote command must verify the actual schema after the transaction commits.
- The status enum must be persisted by name, not ordinal.
- No current API contract or access policy must change in this database-only scope.

---

### Task 1: Persist the server lifecycle status

**Files:**
- Create: `app/backend/src/main/java/com/cloudian/backend/commons/enums/ServerStatus.java`
- Modify: `app/backend/src/main/java/com/cloudian/backend/models/Server.java`
- Test: `app/backend/src/test/java/com/cloudian/backend/models/ServerStatusTest.java`

**Interfaces:**
- Produces: `ServerStatus { ACTIVE, LOCKED, CLOSED }` and `Server#getStatus()` defaulting to `ACTIVE`.

**Acceptance Criteria:**
- A newly constructed `Server` has `ServerStatus.ACTIVE`.
- JPA persists the enum as a non-null string column called `status`.

- [ ] **Step 1: Write the failing test** for the default value.
- [ ] **Step 2: Run the test** and verify it fails because `ServerStatus`/`getStatus` do not exist.
- [ ] **Step 3: Add the enum and entity field** with `@Enumerated(EnumType.STRING)` and a Java default of `ACTIVE`.
- [ ] **Step 4: Run the test** and verify it passes.

### Task 2: Apply and verify the PostgreSQL migration

**Files:**
- Create: `app/backend/src/main/resources/db/migration/V20261102_01__add_server_status.sql`

**Interfaces:**
- Consumes: `ServerStatus` values from Task 1.
- Produces: remote `server.status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE'` constrained to the three enum names.

**Acceptance Criteria:**
- Existing remote rows receive `ACTIVE`.
- The migration is atomic and leaves `deleted_at` untouched.
- Schema verification reports the expected default, nullability, permitted values, and no null statuses.

- [ ] **Step 1: Query remote schema** to record that `server.status` is absent before migration.
- [ ] **Step 2: Add the transactional migration SQL** that adds/backfills/constrains the status column.
- [ ] **Step 3: Execute exactly that migration file** on the configured Supabase datasource.
- [ ] **Step 4: Query remote schema and data** to verify column definition, constraint, and status distribution.

### Task 3: Document API follow-ups

**Files:**
- Modify: none

**Interfaces:**
- Consumes: the persisted status contract from Tasks 1 and 2.
- Produces: an API proposal only; no controller, service, DTO, or soft-delete endpoint changes.

**Acceptance Criteria:**
- The proposal covers list/detail response changes, status filtering/counting, owner-only status changes, and CLOSED/LOCKED behavior.

- [ ] **Step 1: Provide the API proposal** in the completion report.
