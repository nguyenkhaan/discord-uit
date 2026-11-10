# Server Description Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional description to a server, persist it, and make it available when a server is created, listed, or viewed.

**Architecture:** Keep `description` as a nullable `VARCHAR(500)` column on the existing `server` table, reflected as a `String` on the JPA entity. Extend the existing multipart create request and the shared `ServerResponse`; the response change automatically covers create, list, detail, and status-update responses. The frontend regenerates its OpenAPI contract, sends the optional form field, and renders it on the server detail panel.

**Tech Stack:** Java 17, Spring Boot, Spring Data JPA, Jakarta Validation, PostgreSQL, OpenAPI, React 19, TypeScript, Bun.

**Spec:** User request in this conversation dated 2026-11-10.

## Global Constraints

- The Java property and JSON/form field are named `description`; the database column is `description`.
- The field is optional; existing rows remain valid with `NULL`.
- Accept at most 500 characters and store a trimmed non-blank value; normalize omitted or all-whitespace input to `NULL`.
- Do not add a generic server-metadata update endpoint or an edit-description UI in this change.
- Regenerate `app/frontend/src/contract/api-contract.ts`; do not edit it by hand.

## Review Focus

- Existing rows remain readable after the nullable migration, without a backfill or a default string.
- A multipart request carrying only whitespace does not turn into a meaningful stored description.
- A 501-character description is rejected by API validation rather than truncated silently.
- `ServerResponse.of(...)` includes the description on every existing response-producing path.
- The frontend must not append `description` to `FormData` when the optional value is empty, and the detail UI must tolerate an absent value.

---

### Task 1: Add the persistent description contract

**Files:**
- Create: `app/backend/src/main/resources/db/migration/V20261110_01__add_server_description.sql`
- Modify: `app/backend/src/main/java/com/cloudian/backend/models/Server.java`
- Test: `app/backend/src/test/java/com/cloudian/backend/models/ServerDescriptionTest.java`

**Interfaces:**
- Produces: `Server#getDescription()` / `setDescription(String)` backed by nullable column `server.description VARCHAR(500)`.
- Consumed by: `CreateServerRequest`, `ServerService`, and `ServerResponse` in Task 2.

**Acceptance Criteria:**
- New and existing server rows can have no description.
- A 500-character description can be stored; the schema rejects longer direct database writes.

- [ ] **Step 1: Write the failing entity test** that sets a description on `Server` and reads it through the Lombok-generated accessor.
- [ ] **Step 2: Run the test** with `./gradlew test --tests com.cloudian.backend.models.ServerDescriptionTest`; confirm it fails because the accessor does not exist.
- [ ] **Step 3: Add `private String description` to `Server.java`** with `@Column(name = "description", length = 500)`; leave it nullable and add no default.
- [ ] **Step 4: Add the transactional migration** `V20261110_01__add_server_description.sql` that executes `ALTER TABLE server ADD COLUMN IF NOT EXISTS description VARCHAR(500)`.
- [ ] **Step 5: Run the entity test** again and inspect the migration SQL; confirm the test passes and the column is nullable.
- [ ] **Step 6: Commit** the entity and migration with `feat: persist server description`.

### Task 2: Carry the description through the backend API

**Files:**
- Modify: `app/backend/src/main/java/com/cloudian/backend/modules/server/dto/CreateServerRequest.java`
- Modify: `app/backend/src/main/java/com/cloudian/backend/modules/server/ServerService.java`
- Modify: `app/backend/src/main/java/com/cloudian/backend/modules/server/dto/ServerResponse.java`
- Modify: `app/backend/src/test/java/com/cloudian/backend/modules/server/dto/ServerResponseStatusTest.java`
- Modify: `app/backend/src/test/java/com/cloudian/backend/modules/server/ServerStatusServiceTests.java`

**Interfaces:**
- Consumes: `Server#setDescription(String)` from Task 1.
- Produces: `CreateServerRequest(String name, String description, MultipartFile image)` and `ServerResponse(..., String description, ...)`.
- Consumed by: Spring's existing `POST /servers` multipart binding and frontend-generated OpenAPI schemas in Task 3.

**Acceptance Criteria:**
- `POST /servers` accepts an optional `description` form part and rejects a value longer than 500 characters with the existing validation error response.
- Creation saves the normalized description, while create/list/detail/status responses expose it unchanged.

- [ ] **Step 1: Write failing tests**: extend the response-mapping test to assert a server description is present in `ServerResponse`, and add a creation-service test that captures the saved `Server` and asserts whitespace is trimmed (or normalized to `null`).
- [ ] **Step 2: Run the two focused test classes** with `./gradlew test --tests com.cloudian.backend.modules.server.dto.ServerResponseStatusTest --tests com.cloudian.backend.modules.server.ServerStatusServiceTests`; confirm the missing record accessor/field fails.
- [ ] **Step 3: Extend `CreateServerRequest`** with nullable `@Size(max = 500) String description` between `name` and `image`, preserving `name`'s current `@NotBlank @Size(max = 100)` validation.
- [ ] **Step 4: Set the entity value in `ServerService#create`** before saving: trim non-blank input and use `null` for absent or whitespace-only input.
- [ ] **Step 5: Extend `ServerResponse` and `ServerResponse.of(...)`** with `String description` immediately after `name`, so all existing service responses inherit it without controller or repository changes.
- [ ] **Step 6: Run the focused backend tests** again; confirm the persisted/mapped value and existing status assertions pass.
- [ ] **Step 7: Commit** with `feat: expose server description in API`.

### Task 3: Regenerate the client contract and support create/detail UI

**Files:**
- Modify (generated): `app/frontend/src/contract/api-contract.ts`
- Modify: `app/frontend/src/features/server/server.type.ts`
- Modify: `app/frontend/src/features/server/server.service.ts`
- Modify: `app/frontend/src/features/server/components/CreateServerModal.tsx`
- Modify: `app/frontend/src/features/server/components/ServerInfoTab.tsx`
- Modify: `app/frontend/tests/features/server/server.service.test.ts`

**Interfaces:**
- Consumes: OpenAPI schemas generated by Task 2: `CreateServerRequest.description?: string` and `ServerResponse.description?: string`.
- Produces: `CreateServerPayload { name: string; description?: string; image?: File | null }` and a detail view that safely displays optional `server.description`.

**Acceptance Criteria:**
- The create modal accepts up to 500 characters, resets its description when closed/successful, and sends a trimmed non-empty value as multipart data.
- A member sees the description in the Server Info panel; an absent description has an explicit empty-state message.

- [ ] **Step 1: Start the backend with the migration applied, regenerate the contract** from `/api/docs/openapi` using the command documented in `app/frontend/AGENTS.md`, and verify the generated diff contains both description fields only where OpenAPI requires them.
- [ ] **Step 2: Write the failing client-service tests** by mocking `privateClient.post`: assert a non-empty description is present in the submitted `FormData`, and an omitted one is not appended.
- [ ] **Step 3: Extend `CreateServerPayload` and `createServer`** to accept `description` and append it only when defined/non-empty; retain current image behavior.
- [ ] **Step 4: Add a labelled `<textarea>` to `CreateServerModal`** with `id="server-description"`, `maxLength={500}`, state/reset handling, and trimmed payload submission. Follow existing disabled/pending behavior.
- [ ] **Step 5: Render a “Giới thiệu server” section in `ServerInfoTab`** using `server.description`; use a concise empty-state when it is missing and preserve the existing panel actions.
- [ ] **Step 6: Run `bun test tests/features/server/server.service.test.ts`** and confirm the new `FormData` assertions pass.
- [ ] **Step 7: Commit** with `feat: capture and show server description`.

### Task 4: Validate migration, API, and clients together

**Files:**
- Modify: none expected.

**Interfaces:**
- Consumes: the database, backend, and frontend contracts produced by Tasks 1–3.
- Produces: deployment evidence that the database and two clients agree on the optional 500-character field.

**Acceptance Criteria:**
- The target database has a nullable `server.description VARCHAR(500)` column after its approved migration process.
- Backend tests, frontend focused tests, type-check/build, and lint pass with no unrelated file edits.

- [ ] **Step 1: Apply the SQL migration through the project's approved PostgreSQL deployment path** (the repository has no Flyway configuration) and query `information_schema.columns` to confirm type `character varying`, length `500`, and `is_nullable = YES`.
- [ ] **Step 2: Exercise `POST /servers` with multipart data** containing a normal description, an omitted description, whitespace-only description, and 501 characters; verify the first persists, the next two read back as `null`, and the final request receives validation failure.
- [ ] **Step 3: Run backend verification**: `cd app/backend && ./gradlew test`.
- [ ] **Step 4: Run frontend verification**: `cd app/frontend && bun test tests/features/server/server.service.test.ts && bun run build && bun run lint`.
- [ ] **Step 5: Review `git diff --check` and `git status --short`**; confirm only the planned migration, backend API, regenerated contract, frontend UI, and corresponding tests changed.
- [ ] **Step 6: Commit** the verification-ready change if Tasks 1–3 were intentionally kept as one reviewable commit.
