# Document Taxonomy API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add secure admin CRUD and public read APIs for the existing collection and tag taxonomy.

**Architecture:** Keep the current JPA entities and schema. Add a focused `modules.taxonomy` REST/service layer, repository existence checks for official and AI association tables, and DTOs that never expose JPA entities directly.

**Tech Stack:** Spring Boot 4, Spring MVC, Spring Data JPA, Jakarta Validation, JUnit 5, Mockito.

**Spec:** `docs/superpowers/specs/2026-11-21-document-taxonomy-api-design.md`

## Global Constraints

- `category` is out of scope and must not appear in the new API.
- Only `ROLE_ADMIN` may mutate taxonomy; public reads remain available without authentication.
- Collection/tag deletion must fail with `409 CONFLICT` when official or AI association rows exist.
- Use the existing `ApiException` and global error response format.
- Do not add dependencies or redesign the database.

## Review Focus

- A normal user must not reach admin mutation endpoints; controller security tests pin `403` behavior.
- Duplicate values must be deterministic even when the database constraint is the final arbiter; service and repository tests pin `409` behavior.
- Delete protection must cover both official document links and AI suggestion links; repository/service tests pin both association families.
- Public list/detail responses must not serialize JPA relationships or private document rows; DTO/controller tests pin the response shape.
- Invalid page values and invalid slugs must produce the existing `400` response contract; validation tests pin the boundary.

### Task 1: Repository and DTO contracts

**Files:**
- Create: `app/backend/src/main/java/com/cloudian/backend/repositories/CollectionRepository.java`
- Create: `app/backend/src/main/java/com/cloudian/backend/repositories/TagRepository.java`
- Create: `app/backend/src/main/java/com/cloudian/backend/repositories/DocumentCollectionRepository.java`
- Create: `app/backend/src/main/java/com/cloudian/backend/repositories/DocumentTagRepository.java`
- Create: `app/backend/src/main/java/com/cloudian/backend/repositories/AgentClassificationCollectionRepository.java`
- Create: `app/backend/src/main/java/com/cloudian/backend/repositories/AgentClassificationTagRepository.java`
- Create: `app/backend/src/main/java/com/cloudian/backend/modules/taxonomy/dto/CollectionRequest.java`
- Create: `app/backend/src/main/java/com/cloudian/backend/modules/taxonomy/dto/TagRequest.java`
- Create: `app/backend/src/main/java/com/cloudian/backend/modules/taxonomy/dto/CollectionResponse.java`
- Create: `app/backend/src/main/java/com/cloudian/backend/modules/taxonomy/dto/TagResponse.java`
- Create: `app/backend/src/main/java/com/cloudian/backend/modules/taxonomy/dto/TaxonomyListResponse.java`
- Test: `app/backend/src/test/java/com/cloudian/backend/modules/taxonomy/TaxonomyDtoValidationTest.java`

**Interfaces:**
- Repositories expose pageable search by normalized name/slug and `existsBy...` association checks.
- Request records expose `name`, `description`, `slug`, and collection `keywords`.
- Responses expose only stable scalar fields plus timestamps and IDs.

**Acceptance Criteria:**
- Request validation rejects blank names/slugs, invalid slug format, and oversized fields.
- Collection keywords are represented as a list; tag has no category field.
- List response includes items and page metadata.

- [ ] Write the failing DTO validation tests.
- [ ] Run the focused tests and verify they fail because the DTOs do not exist.
- [ ] Implement repositories and immutable DTO records.
- [ ] Run the focused tests and verify they pass.

### Task 2: Taxonomy service and REST API

**Files:**
- Create: `app/backend/src/main/java/com/cloudian/backend/modules/taxonomy/TaxonomyService.java`
- Create: `app/backend/src/main/java/com/cloudian/backend/modules/taxonomy/TaxonomyController.java`
- Create: `app/backend/src/main/java/com/cloudian/backend/modules/taxonomy/AdminTaxonomyController.java`
- Test: `app/backend/src/test/java/com/cloudian/backend/modules/taxonomy/TaxonomyServiceTests.java`
- Test: `app/backend/src/test/java/com/cloudian/backend/modules/taxonomy/TaxonomyAuthorizationTests.java`

**Interfaces:**
- Consumes the repositories and DTOs from Task 1.
- Produces public `GET` endpoints and admin `GET/POST/PATCH/DELETE` endpoints for both resources.

**Acceptance Criteria:**
- Public list/detail endpoints return deterministic data and never expose entity relationships.
- Admin can create, update, and delete unused collections/tags.
- Duplicate name/slug is returned as `409 CONFLICT`.
- Delete returns `409 CONFLICT` when official document or AI suggestion associations exist.
- Only `ADMIN` can mutate; regular users are denied by method security.
- No category endpoint or category field is introduced.

- [ ] Write failing service tests for CRUD, normalization, duplicate conflict, and both delete-protection families.
- [ ] Run focused service tests and verify they fail because the service does not exist.
- [ ] Implement the service with transaction boundaries and predictable `ApiException` messages/statuses.
- [ ] Write failing controller authorization tests for public reads and admin-only writes.
- [ ] Run them and verify the authorization behavior is not yet implemented.
- [ ] Implement controllers with `@PreAuthorize` and validation.
- [ ] Run focused tests and verify they pass.

### Task 3: Seed/schema compatibility and full verification

**Files:**
- Modify: `app/backend/src/main/java/com/cloudian/backend/data/SeedScript.java` only if its modeled-table validation still references dropped category tables.
- Modify: `app/backend/src/main/java/com/cloudian/backend/data/data.json` only if required to keep the existing seed command compatible with the normalized schema.
- Test: `app/backend/src/test/java/com/cloudian/backend/data/SeedScriptTests.java` if coverage needs updating.

**Interfaces:**
- Consumes the taxonomy tables and API implementation from Tasks 1–2.
- Produces a backend that starts and executes the existing seed/test path without category-table failures.

**Acceptance Criteria:**
- Existing backend tests remain green.
- Seed compatibility cleanup does not reintroduce category tables or mutate document classification semantics.
- The full backend test suite passes.

- [ ] Run the focused taxonomy suite and the existing seed tests.
- [ ] If stale category references fail, write/update the failing compatibility test first.
- [ ] Apply the smallest compatibility cleanup.
- [ ] Run `./gradlew test` from `app/backend` and inspect the complete result.
