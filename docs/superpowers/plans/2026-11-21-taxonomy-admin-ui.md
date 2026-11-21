# Taxonomy Admin UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the `/admin/documents` taxonomy workspace and a lightweight public taxonomy browser without connecting API endpoints yet.

**Architecture:** Reuse the existing `AdminLayout`, admin table primitives, tabs, modal and confirm dialog. Keep mock taxonomy data in a shared feature module; page mutations remain local so the UI can demonstrate create/edit/delete, validation, conflict, loading, empty and error states before API integration.

**Tech Stack:** React 19, TypeScript strict, React Router, Tailwind CSS v4, Lucide icons.

## Global Constraints

- Do not add API calls, Axios services, hooks, or changes to the generated API contract in this slice.
- Use `collection + tag`; do not introduce category UI.
- Keep all controls keyboard accessible and responsive at mobile widths.
- Reuse existing semantic design tokens and admin primitives.

## Review Focus

- Duplicate name/slug and invalid slug must remain visible inline in the form.
- Referenced taxonomy must show a conflict dialog and remain undeleted.
- Search and pagination must reset consistently after tab or filter changes.
- Form labels, focus states, modal focus trap and icon-only action labels must remain accessible.
- Public collection detail must be deep-linkable by slug without pretending document search is implemented.

### Task 1: Shared mock taxonomy model

- [ ] Add typed collection/tag records and realistic mock data.
- [ ] Add a short UI design/interaction note to this plan.

### Task 2: Admin taxonomy workspace

- [ ] Add the collection/tag tabs, local search, pagination and table states.
- [ ] Add create/edit modal with slug validation and duplicate feedback.
- [ ] Add delete confirmation and referenced-taxonomy conflict handling.
- [ ] Replace the existing `/admin/documents` ComingSoon route.

### Task 3: Public taxonomy surface

- [ ] Replace the authenticated `/documents` ComingSoon route with collection cards and tag filter primitive.
- [ ] Add `/documents/collections/:slug` detail route with collection metadata and a Task 5.5 boundary message.

### Task 4: Verification

- [ ] Run frontend type-check, lint and production build.
- [ ] Run existing frontend tests if the repository test runner is available.
- [ ] Review responsive and accessibility states in the rendered UI.
