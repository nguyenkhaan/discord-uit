# Document pages layout and filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add safe page spacing, simplify upload progress feedback, and replace the single-tag document browsing control with a reusable multi-select filter.

**Architecture:** The two document pages own their responsive content inset. `DocumentFilter` is a controlled feature component that emits search, collection slugs, and tag slugs; `DocumentsPage` owns filtering and collection-card rendering. Upload changes remain local to `DocumentUploadPage`.

**Tech Stack:** React 19, TypeScript, React Router, TanStack Query, Tailwind CSS 4, Bun tests.

**Spec:** `docs/superpowers/specs/2026-11-22-document-pages-layout-filter-design.md`

## Global Constraints

- Do not change backend APIs, database models, or upload behavior.
- Reuse existing design tokens/components and do not add a UI dependency.
- Preserve accessible labels, keyboard focus styles, touch-friendly controls, and reduced-motion behavior.
- Use `@/` imports and feature components under `features/documents/components`.

## Review Focus

- Empty collection/tag selections must mean “all” rather than “none”; test the filter helper.
- Multiple selected values must combine predictably; test AND across groups and OR within a group.
- Long filter lists must remain usable on mobile without horizontal overflow; inspect responsive markup and minimum control sizes.
- Upload errors must remain visible while progress text is removed; test the progress-only pending UI with a page-level assertion if practical.
- Shared layout behavior must remain unchanged; verify padding is scoped to the two document page shells.

### Task 1: Shared content inset

**Files:**
- Modify: `app/frontend/src/features/documents/pages/DocumentsPage.tsx`
- Modify: `app/frontend/src/features/documents/pages/DocumentUploadPage.tsx`
- Test: existing document page and layout tests

**Interfaces:**
- Produces: responsive page shells with consistent horizontal and vertical padding for the two document routes only.

**Acceptance Criteria:**
- Document pages have visible space from the header and sidebar at desktop and mobile widths.
- Other `MainLayout` pages retain their existing spacing.
- Existing layout composition tests remain green.

- [ ] **Step 1: Add responsive page-shell classes** to both document pages, including loading/error return shells.
- [ ] **Step 2: Run the existing layout and document tests** to confirm shared layout behavior remains unchanged.

### Task 2: Reusable document filter

**Files:**
- Create: `app/frontend/src/features/documents/components/DocumentFilter.tsx`
- Create: `app/frontend/src/features/documents/document-filter.utils.ts`
- Create: `app/frontend/tests/features/documents/document-filter.utils.test.ts`
- Modify: `app/frontend/src/features/documents/pages/DocumentsPage.tsx`

**Interfaces:**
- Produces `DocumentFilterValue` with `search: string`, `collectionSlugs: string[]`, and `tagSlugs: string[]`.
- Produces `filterDocumentCollections(collections, filters)` for the page and tests.

**Acceptance Criteria:**
- Search matches name, slug, description, or keywords.
- A group with several checked values matches any selected value in that group.
- Collection and tag groups together narrow results with AND semantics.
- Users can clear all filters and see selected counts.
- Controls are labeled, keyboard accessible, and responsive.

- [ ] **Step 1: Write utility tests** for empty filters, search, multi-select OR behavior, AND behavior, and clear state.
- [ ] **Step 2: Run the utility test** and confirm it fails because the helper does not exist.
- [ ] **Step 3: Implement the filter utility and controlled component** using existing `Input`, `cn`, semantic buttons, and native checkbox inputs.
- [ ] **Step 4: Replace the inline search/tag controls in `DocumentsPage`** with `DocumentFilter`, preserving loading/error/retry and collection cards.
- [ ] **Step 5: Run utility and existing document tests** and confirm all pass.

### Task 3: Upload progress-only feedback

**Files:**
- Modify: `app/frontend/src/features/documents/pages/DocumentUploadPage.tsx`

**Interfaces:**
- Consumes the existing upload mutation and progress percentage; no API changes.

**Acceptance Criteria:**
- During upload, the progress bar and percentage remain visible.
- The literal “Đang tải lên MinIO…” message is removed.
- Success and error feedback remain unchanged.

- [ ] **Step 1: Remove the MinIO loading text** while retaining the accessible live progress region and percentage.
- [ ] **Step 2: Run frontend type-check and document tests** to confirm the UI-only change is safe.

### Task 4: Verification

**Files:**
- Test: existing frontend test suite and build artifacts.

**Interfaces:**
- Consumes Tasks 1–3.

**Acceptance Criteria:**
- Focused tests, all frontend tests, type-check, build, targeted lint, and format checks pass.
- Any unrelated pre-existing lint failures are recorded rather than silently changed.

- [ ] **Step 1: Run `bun test` from `app/frontend`.**
- [ ] **Step 2: Run `bun run type-check` and `bun run build`.**
- [ ] **Step 3: Run targeted ESLint and Prettier checks for changed files.**
- [ ] **Step 4: Run `git diff --check` and inspect the final diff.**
