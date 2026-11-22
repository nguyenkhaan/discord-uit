# Documents Catalog Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign `/documents` as a responsive catalog with an HTML/CSS banner, compact right filter, featured collections, paginated collection table, and skeleton-first loading.

**Architecture:** Keep taxonomy data in the existing TanStack Query hooks and reuse `DocumentFilter` plus the shared select primitives. Add small pure helpers for client-side sort/pagination, then compose the page from stable sections that each have a skeleton equivalent.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Lucide React, TanStack Query, Bun test.

**Spec:** `docs/superpowers/specs/2026-11-22-documents-catalog-redesign.md`

## Global Constraints

- Banner must be built with HTML/Tailwind/Lucide, never the reference image.
- Collection/tag choices use the existing `MultiSelectBox`; sorting uses `SelectBox`.
- Loading states use the shared `Skeleton` component instead of a page spinner.
- Preserve collection/tag filter semantics: OR inside each group, AND between groups.
- Do not change `MainLayout` spacing or add a new backend document endpoint.
- Update `app/frontend/AGENTS.md` with the shared component/loading rules.

## Tasks

### Task 1: Harden shared select accessibility

**Files:**
- Modify: `app/frontend/src/components/common/SearchableSelectMenu.tsx`
- Modify: `app/frontend/src/components/common/SelectBox.tsx`
- Modify: `app/frontend/src/components/common/MultiSelectBox.tsx`
- Test: `app/frontend/tests/components/common/SelectBox.test.tsx`
- Test: `app/frontend/tests/components/common/MultiSelectBox.test.tsx`

**Acceptance Criteria:**
- Search input is outside the `role="listbox"` element and points to it with `aria-controls`.
- Focus leaving the dropdown closes it; Escape/outside pointer still close it.
- Disabled state closes an open menu; empty string values remain selectable.

### Task 2: Add catalog sort and pagination helpers

**Files:**
- Create: `app/frontend/src/features/documents/documents-catalog.utils.ts`
- Test: `app/frontend/tests/features/documents/documents-catalog.utils.test.ts`

**Interfaces:**
- `DocumentCatalogSort = 'newest' | 'name' | 'documents'`.
- `sortDocumentCollections(collections, sort): TaxonomyCollection[]`.
- `paginateDocumentCollections(collections, page, pageSize): { items; page; pageCount; total }`.

**Acceptance Criteria:**
- Sorting returns a new array and handles missing/invalid dates deterministically.
- Pagination is one-based, clamps to valid pages, and handles empty input.

### Task 3: Redesign the documents page and filter rail

**Files:**
- Modify: `app/frontend/src/features/documents/pages/DocumentsPage.tsx`
- Modify: `app/frontend/src/features/documents/components/DocumentFilter.tsx`
- Modify: `app/frontend/src/components/common/Skeleton.tsx` only if a shared primitive extension is strictly necessary

**Interfaces:**
- Consumes catalog helpers from Task 2 and existing `DocumentFilterValue`/select components.

**Acceptance Criteria:**
- Header, category rail, CSS banner, featured collection cards, compact right filter, and “Tất cả collection” table match the supplied composition without using the image as an asset.
- Table has sort control, collection/tag/search filtering, eight rows per page, previous/next/page controls, empty state, and horizontal overflow on small screens.
- Loading renders skeleton sections for header/banner/featured/filter/table; no full-page loading spinner remains on `/documents`.
- Filter and sort reset pagination to page 1; selected filters update counts and visible rows.

### Task 4: Update frontend guidance and verify

**Files:**
- Modify: `app/frontend/AGENTS.md`
- Modify: `.superpowers/sdd/2026-11-22-documents-catalog-redesign/progress.md`

**Acceptance Criteria:**
- AGENTS states that shared SelectBox/MultiSelectBox must be reused and data-list loading should prefer Skeleton sections.
- Full tests, type-check, build, targeted lint, formatting, and diff checks pass.
- Full lint baseline findings are reported accurately.
