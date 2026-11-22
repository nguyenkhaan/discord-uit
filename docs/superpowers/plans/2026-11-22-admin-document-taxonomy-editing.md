# Admin Document Size and Taxonomy Editing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix misleading document-size formatting and let admins view, edit, and save multiple collections and tags from the document review page.

**Architecture:** Add a transactional admin PATCH endpoint that replaces a document's collection/tag associations by slug. Keep taxonomy editing in a feature component backed by existing `MultiSelectBox` and TanStack Query hooks. Extract byte formatting into a shared frontend utility used by the admin list and review page.

**Tech Stack:** Spring Boot 4, Spring Data JPA, PostgreSQL, JUnit 5/Mockito, React 19, TypeScript strict, TanStack Query, Axios, Tailwind CSS v4, Bun/Vitest.

**Spec:** `docs/superpowers/specs/2026-11-22-admin-document-taxonomy-editing-design.md`

## Global Constraints

- Use `MultiSelectBox` at `src/components/common/MultiSelectBox.tsx`; do not create a feature-local dropdown.
- Keep API calls in `*.service.ts` and query/mutation logic in `*.hooks.ts`; the page only composes UI and state.
- `src/contract/api-contract.ts` is generated and must not be edited manually.
- Taxonomy replacement must be transactional and allow empty collection/tag lists.
- Taxonomy editing is allowed for pending, approved, and rejected submissions because associations belong to the document.
- Collection/tag option loading uses the existing catalog query limit of 100 items; a future catalog larger than 100 needs a separate server-search slice.
- Use semantic frontend design tokens and local skeletons for taxonomy loading; do not replace the whole page with a spinner.
- Do not create a commit in this session.

## Review Focus

- Unknown or blank collection/tag slugs must fail before associations are replaced; test that the document's existing links remain intact in the transaction boundary.
- Saving an empty selection must remove all links; test both collections and tags independently.
- Duplicate slugs must not create duplicate association rows; test stable de-duplication.
- A small valid DOCX must display KB, not `0.0 MB`; test boundary values around 1 KiB and 1 MiB.
- Taxonomy loading/error and save-error states must preserve the page layout and the admin's unsaved selections; cover the UI state through component/service tests where practical.

### Task 1: Transactional document taxonomy API

**Files:**
- Create: `app/backend/src/main/java/com/cloudian/backend/modules/document/dto/DocumentTaxonomyUpdateRequest.java`
- Create: `app/backend/src/main/java/com/cloudian/backend/modules/document/dto/DocumentTaxonomyResponse.java`
- Modify: `app/backend/src/main/java/com/cloudian/backend/repositories/DocumentCollectionRepository.java`
- Modify: `app/backend/src/main/java/com/cloudian/backend/repositories/DocumentTagRepository.java`
- Modify: `app/backend/src/main/java/com/cloudian/backend/modules/document/DocumentService.java`
- Modify: `app/backend/src/main/java/com/cloudian/backend/modules/document/AdminDocumentController.java`
- Test: `app/backend/src/test/java/com/cloudian/backend/modules/document/DocumentServiceTest.java`

**Interfaces:**
- Consumes: existing `Document`, `Collection`, `Tag`, `DocumentCollection`, `DocumentTag`, and repositories.
- Produces: `DocumentService.updateTaxonomy(UUID documentId, DocumentTaxonomyUpdateRequest request): DocumentTaxonomyResponse` and `PATCH /admin/documents/{documentId}/taxonomy`.

**Acceptance Criteria:**
- A valid request resolves collection/tag slugs, replaces existing links atomically, and returns sorted selected slugs.
- Empty lists clear only the requested taxonomy list; both empty lists clear all taxonomy links.
- Duplicate slugs are de-duplicated before persistence.
- Unknown document returns 404; unknown collection/tag returns 400 without leaving a partial replacement.
- Endpoint remains admin-only through the existing controller security annotation.

- [ ] **Step 1: Write failing service tests**

Add tests for replacing multiple links on an approved document, clearing both lists, de-duplicating input, rejecting an unknown slug/blank value, and preserving the old links when resolution fails. Assert repository deletes/saves and the response values.

- [ ] **Step 2: Run backend tests to verify RED**

Run: `./gradlew test --tests com.cloudian.backend.modules.document.DocumentServiceTest`

Expected: compile/test failure because the request/response/service method and repository delete methods do not exist yet.

- [ ] **Step 3: Implement request/response and repository contracts**

Use nullable lists normalized to empty lists in the service. Add `deleteByDocument_Id(UUID documentId)` to both association repositories.

- [ ] **Step 4: Implement `DocumentService.updateTaxonomy(...)`**

Find the document or throw `ApiException(HttpStatus.NOT_FOUND, ...)`; normalize each list using `LinkedHashSet`, resolve every slug before deleting, delete and flush old links, create `DocumentCollection` with `new DocumentCollectionId(documentId, collectionId)` and `DocumentTag` links, save them, update the managed document sets, and return sorted slugs.

- [ ] **Step 5: Expose the admin PATCH endpoint**

Add a `@PatchMapping("/{documentId}/taxonomy")` method to `AdminDocumentController` with `@Valid @RequestBody DocumentTaxonomyUpdateRequest` and `UUID documentId`.

- [ ] **Step 6: Run backend tests to verify GREEN**

Run: `./gradlew test --tests com.cloudian.backend.modules.document.DocumentServiceTest`

Expected: all document service tests pass.

- [ ] **Step 7: Add and run upload-size regression assertion**

Extend the existing multipart upload test to assert `Media.sizeBytes` and the returned `sizeBytes` equal the exact uploaded byte length, then rerun the same focused test command.

### Task 2: Correct byte-size formatting

**Files:**
- Create: `app/frontend/src/features/documents/document.format.ts`
- Create: `app/frontend/tests/features/documents/document.format.test.ts`
- Modify: `app/frontend/src/features/admin/pages/AdminDocumentListPage.tsx`
- Modify: `app/frontend/src/features/admin/pages/AdminDocumentReviewPage.tsx`

**Interfaces:**
- Produces: `formatFileSize(sizeBytes: number): string` with `B`, `KB`, `MB`, and `GB` units.

**Acceptance Criteria:**
- Positive values below 1 KiB display bytes; values below 1 MiB display one decimal KB; values below 1 GiB display one decimal MB; larger values display one decimal GB.
- A two-page DOCX-sized value such as `32768` displays `32.0 KB`, never `0.0 MB`.
- Existing list and detail/review views use the shared formatter.

- [ ] **Step 1: Write failing formatter tests**

Cover `0`, `1023`, `1024`, `32768`, `1048575`, `1048576`, and `1073741824` with exact expected strings.

- [ ] **Step 2: Run formatter tests to verify RED**

Run: `bun test tests/features/documents/document.format.test.ts`

Expected: FAIL because the shared formatter does not exist.

- [ ] **Step 3: Implement and adopt `formatFileSize`**

Use base-1024 thresholds and one decimal for KB/MB/GB. Replace both local format functions/import the shared utility; do not change the stored `sizeBytes` contract.

- [ ] **Step 4: Run formatter tests and frontend type-check**

Run: `bun test tests/features/documents/document.format.test.ts && bun run type-check`

Expected: all formatter tests pass and TypeScript reports no errors.

### Task 3: Connect taxonomy API and build the admin editor

**Files:**
- Modify: `app/frontend/src/features/documents/document.type.ts`
- Modify: `app/frontend/src/features/documents/document.service.ts`
- Modify: `app/frontend/src/features/documents/document.hooks.ts`
- Create: `app/frontend/src/features/admin/components/AdminDocumentTaxonomyEditor.tsx`
- Modify: `app/frontend/src/features/admin/pages/AdminDocumentReviewPage.tsx`
- Test: `app/frontend/tests/features/documents/document.service.test.ts`

**Interfaces:**
- Consumes: Task 1 `PATCH /admin/documents/{documentId}/taxonomy` and existing `TaxonomyCollection`/`TaxonomyTag` query hooks.
- Produces: `useUpdateAdminDocumentTaxonomyMutation()` and a reusable `AdminDocumentTaxonomyEditor` with selected slugs, taxonomy options, save callback, loading/error, and saving states.

**Acceptance Criteria:**
- The taxonomy card shows current collection/tag names and empty states separately.
- Two searchable `MultiSelectBox` controls are stacked vertically and support multiple collection/tag selections.
- The save button is disabled when unchanged or saving, sends both arrays, and shows success/error feedback.
- Failed saves preserve unsaved choices; successful saves invalidate admin submissions and taxonomy queries so the detail/list views refresh.
- Taxonomy loading uses a local card skeleton; it does not skeletonize the header, metadata, or preview.
- The editor works for pending, approved, and rejected submissions.

- [ ] **Step 1: Write failing service test for taxonomy update payload**

Add a test that calls `updateAdminDocumentTaxonomy` with a document ID and both slug arrays, asserts the PATCH URL/body, and maps the focused response.

- [ ] **Step 2: Run the focused frontend test to verify RED**

Run: `bun test tests/features/documents/document.service.test.ts`

Expected: FAIL because the service function and response type do not exist.

- [ ] **Step 3: Implement frontend type/service/hook wiring**

Add `DocumentTaxonomyUpdateInput`, `DocumentTaxonomyResponse`, the Axios service call, a query mutation keyed by `documentKeys.adminSubmissions()`, and invalidation on success.

- [ ] **Step 4: Build `AdminDocumentTaxonomyEditor`**

Use `MultiSelectBox` with options mapped from taxonomy query data. Render selected names as chips, keep local selections controlled by the parent, expose `onSave`, and render a small skeleton/error state for option loading.

- [ ] **Step 5: Integrate the editor into `AdminDocumentReviewPage`**

Load admin collections/tags, initialize selections from the current submission, reset them when the submission changes, compare sets for dirty state, and show `Lưu phân loại` below the current chips. Keep the existing status controls always visible.

- [ ] **Step 6: Run frontend verification**

Run: `bun test && bun run type-check && bunx eslint src/features/admin/components/AdminDocumentTaxonomyEditor.tsx src/features/admin/pages/AdminDocumentReviewPage.tsx src/features/documents/document.service.ts src/features/documents/document.hooks.ts && bunx prettier --check src/features/admin/components/AdminDocumentTaxonomyEditor.tsx src/features/admin/pages/AdminDocumentReviewPage.tsx src/features/documents/document.service.ts src/features/documents/document.hooks.ts src/lib/formatFileSize.ts`

Expected: all tests, type-check, lint, and formatting checks pass.

- [ ] **Step 7: Preserve fallback labels and taxonomy cache invalidation**

When integrating the editor, keep a selected slug visible even if it is absent from the current 100-item option result, and invalidate both `documentKeys.adminSubmissions()` and `taxonomyKeys.all` after a successful update so collection/tag document counts stay accurate.

### Task 4: Contract regeneration and whole-project verification

**Files:**
- Modify: `app/frontend/src/contract/api-contract.ts` only through OpenAPI generation, if backend is running.

**Interfaces:**
- Consumes: Task 1 backend OpenAPI endpoint and Task 3 service types.
- Produces: generated frontend contract containing the taxonomy PATCH operation when the backend OpenAPI endpoint is reachable.

**Acceptance Criteria:**
- If backend is reachable, regenerate the contract with the documented command and ensure the generated file remains type-safe.
- Run the full frontend suite and build.
- Run the full backend suite; report any pre-existing unrelated failures separately.
- `git diff --check` passes and no commit is created.

- [ ] **Step 1: Regenerate API contract when available**

Run from `app/frontend`: `bunx openapi-typescript http://localhost:4000/api/docs/openapi --output src/contract/api-contract.ts`; if unavailable, record that the explicit service boundary type is intentionally retained and verify the backend endpoint through its controller test/service tests.

- [ ] **Step 2: Run final verification**

Run: `bun test`, `bun run type-check`, `bun run lint`, `bun run build`, `./gradlew test`, and `git diff --check`.

- [ ] **Step 3: Inspect final diff and status**

Confirm only files in this plan plus the design/plan docs changed, preserve unrelated user changes, and leave the worktree uncommitted for the user.

### Task 5: Close-on-second-click behavior for common dropdowns

**Files:**
- Modify: `app/frontend/src/components/common/select.utils.ts`
- Modify: `app/frontend/src/components/common/SelectBox.tsx`
- Modify: `app/frontend/src/components/common/MultiSelectBox.tsx`
- Modify: `app/frontend/tests/components/common/select.utils.test.ts`

**Interfaces:**
- Produces: `getDropdownStateAfterTriggerClick(isOpen: boolean): boolean`, used by both common dropdown triggers.

**Acceptance Criteria:**
- Clicking an open SelectBox or MultiSelectBox trigger closes it and does not reopen it due to the menu's blur handler.
- Clicking a closed trigger still opens it.
- The shared utility regression test covers both states.

- [x] **Step 1: Write and run the failing regression test**

The test initially failed because the shared trigger-state helper was missing.

- [x] **Step 2: Implement the minimal shared trigger-state fix**

Use the render-time `isOpen` value rather than a functional updater that can observe the blur-close update first.

- [x] **Step 3: Verify dropdown tests, lint, and formatting**

`bun test tests/components/common/select.utils.test.ts` passed with 5 tests; targeted ESLint and Prettier checks passed.
