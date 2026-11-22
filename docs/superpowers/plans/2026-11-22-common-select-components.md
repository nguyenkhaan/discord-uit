# Common SelectBox and MultiSelectBox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build reusable searchable `SelectBox` and `MultiSelectBox` components and use `MultiSelectBox` for collection/tag filters on `/documents`.

**Architecture:** Add a shared option type, pure selection/search helpers, and one private searchable menu renderer under `src/components/common`. `SelectBox` and `MultiSelectBox` own controlled values plus open/search state and delegate menu rendering to that shared layer. `DocumentFilter` maps taxonomy data to generic options and keeps the existing document filter contract.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Lucide React, Bun test with Node test/assert.

**Spec:** `docs/superpowers/specs/2026-11-22-common-select-components-design.md`

## Global Constraints

- Do not add a select/popover dependency.
- Keep components controlled and generic over string values.
- Search is performed locally against option label, value, and optional description.
- `MultiSelectBox` toggles selections without closing; `SelectBox` closes after selection.
- Do not change `MainLayout` spacing or backend contracts.
- Preserve document filtering semantics: OR within collection/tag groups, AND between groups.

## Review Focus

- Empty search results must be explicit and must not mutate the selected values; test option filtering with no matches in Task 1.
- Disabled options must not be selectable; test toggle helpers and render behavior in Task 2.
- A multi-select trigger must remain understandable for zero, one, and many selections; test summary formatting in Task 1.
- Outside click and `Escape` must close the menu without losing the current query/value; verify via component interaction test or focused browser-like test in Task 2.
- Document taxonomy options may have long labels/descriptions; test option mapping and responsive layout in Task 3.

---

### Task 1: Define option contracts and selection helpers

**Files:**
- Create: `app/frontend/src/components/common/select.types.ts`
- Create: `app/frontend/src/components/common/select.utils.ts`
- Test: `app/frontend/tests/components/common/select.utils.test.ts`

**Interfaces:**
- Produces `SelectOption { value: string; label: string; description?: string; disabled?: boolean }`.
- Produces `filterSelectOptions(options, query): SelectOption[]`.
- Produces `toggleSelectValue(values, value, disabled?): string[]`.
- Produces `getMultiSelectSummary(selectedOptions, placeholder): string`.

**Acceptance Criteria:**
- Search matches label, value, and description case-insensitively and trims whitespace.
- Disabled options are ignored by toggling.
- Toggling adds a missing value and removes an existing value without mutating the input array.
- Summary returns placeholder for none, the option label for one, and a concise count for multiple selections.

- [ ] **Step 1: Write the failing tests**

  Add tests for search matching, no-result filtering, immutable toggle behavior, disabled options, and zero/one/many summary states.

- [ ] **Step 2: Run the focused tests to verify they fail**

  Run: `bun test tests/components/common/select.utils.test.ts`

  Expected: FAIL because the new helper module does not exist yet.

- [ ] **Step 3: Implement the option type and pure helpers**

  Keep helpers side-effect free so both select components and future forms can reuse them.

- [ ] **Step 4: Run the focused tests to verify they pass**

  Run: `bun test tests/components/common/select.utils.test.ts`

  Expected: all helper tests pass.

### Task 2: Implement reusable `SelectBox` and `MultiSelectBox`

**Files:**
- Create: `app/frontend/src/components/common/SearchableSelectMenu.tsx`
- Create: `app/frontend/src/components/common/useDismissibleDropdown.ts`
- Create: `app/frontend/src/components/common/SelectBox.tsx`
- Create: `app/frontend/src/components/common/MultiSelectBox.tsx`
- Create: `app/frontend/tests/components/common/SelectBox.test.tsx`
- Create: `app/frontend/tests/components/common/MultiSelectBox.test.tsx`

**Interfaces:**
- Consumes `SelectOption`, `filterSelectOptions`, `toggleSelectValue`, and `getMultiSelectSummary` from Task 1.
- Produces `SelectBoxProps { id?; label?; value: string | null; options: SelectOption[]; onChange(value: string | null): void; placeholder?; searchPlaceholder?; emptyMessage?; disabled?; className? }`.
- Produces `MultiSelectBoxProps { id?; label?; value: string[]; options: SelectOption[]; onChange(values: string[]): void; placeholder?; searchPlaceholder?; emptyMessage?; disabled?; className? }`.

**Acceptance Criteria:**
- Both triggers expose `aria-haspopup="listbox"`, `aria-expanded`, and an accessible label.
- Opening the menu shows a compact search input and filtered options inside a bounded, scrollable panel.
- `SelectBox` displays the selected label, changes the controlled value once, and closes after selection.
- `MultiSelectBox` displays placeholder/one-selection/multiple-selection summaries, toggles values without closing, and marks selected options.
- Click outside and `Escape` close the menu; focus-visible styles remain clear; disabled options cannot be selected.
- The menu works at mobile widths without clipping beyond its parent.

- [ ] **Step 1: Write failing component/markup tests**

  Assert closed trigger markup, accessible listbox attributes when the menu is rendered, selected summaries, option labels/descriptions, and disabled state. Use the repository's static markup test convention plus the helpers from Task 1 for deterministic selection behavior.

- [ ] **Step 2: Run focused component tests to verify they fail**

  Run: `bun test tests/components/common/SelectBox.test.tsx tests/components/common/MultiSelectBox.test.tsx`

  Expected: FAIL because the components do not exist yet.

- [ ] **Step 3: Implement the shared searchable menu**

  Build a private menu renderer with an anchored absolute panel, search input, empty state, option rows, selected indicators, keyboard-friendly buttons, and the shared outside-click/`Escape` behavior supplied by the wrappers. Keep the outside-click hook in `useDismissibleDropdown.ts` so Fast Refresh sees component-only exports in the menu file.

- [ ] **Step 4: Implement controlled `SelectBox`**

  Manage only open/query UI state locally, call `onChange` with the selected string or `null`, clear query after selection, and close the menu.

- [ ] **Step 5: Implement controlled `MultiSelectBox`**

  Keep the menu open while toggling, derive the trigger summary from selected options, and return a new values array on every change.

- [ ] **Step 6: Run focused component tests to verify they pass**

  Run: `bun test tests/components/common/SelectBox.test.tsx tests/components/common/MultiSelectBox.test.tsx tests/components/common/select.utils.test.ts`

  Expected: all focused tests pass.

### Task 3: Apply `MultiSelectBox` to the document filter

**Files:**
- Modify: `app/frontend/src/features/documents/components/DocumentFilter.tsx`
- Modify: `app/frontend/src/features/documents/pages/DocumentsPage.tsx` only if integration typing requires it
- Test: `app/frontend/tests/features/documents/document-filter.utils.test.ts` (extend option mapping/clear coverage if needed)

**Interfaces:**
- Consumes `MultiSelectBox` and `SelectOption` from Task 2.
- Preserves `DocumentFilterValue { search: string; collectionSlugs: string[]; tagSlugs: string[] }` and `filterDocumentCollections`.

**Acceptance Criteria:**
- The filter shows one search input for name/slug plus two dropdown controls: collection and tag.
- Both dropdown menus support searching and multiple selection; selected counts appear in their triggers or labels.
- Collection options show the collection name and document count; tag options show the tag name and document count.
- Clearing the filter resets search, collections, and tags and updates the result count.
- Existing OR/AND document filtering behavior remains unchanged.

- [ ] **Step 1: Add/adjust the integration test expectations**

  Extend pure filter tests only for any new option mapping/clear behavior; do not duplicate component internals in page tests.

- [ ] **Step 2: Replace inline checkbox panels with `MultiSelectBox`**

  Map taxonomy collections/tags to stable `{ value, label, description }` options and connect controlled values to the existing `DocumentFilterValue` updater.

- [ ] **Step 3: Run focused document/filter tests**

  Run: `bun test tests/components/common/select.utils.test.ts tests/components/common/SelectBox.test.tsx tests/components/common/MultiSelectBox.test.tsx tests/features/documents/document-filter.utils.test.ts`

  Expected: all select and document filter tests pass.

### Task 4: Full verification and visual review

**Files:**
- Modify: `.superpowers/sdd/2026-11-22-common-select-components/progress.md`

**Interfaces:**
- Consumes all components and document filter changes from Tasks 1–3.

**Acceptance Criteria:**
- Full frontend tests, type-check, build, targeted lint, and formatting pass.
- `git diff --check` passes.
- Full lint results are reported accurately, including any pre-existing unrelated errors.
- Review the dropdown at desktop and mobile widths for clipping, focus visibility, and readable selected summaries.

- [ ] **Step 1: Run full frontend verification**

  Run from `app/frontend`:

  ```bash
  bun test
  bun run type-check
  bun run build
  bunx eslint src/components/common/SelectBox.tsx src/components/common/MultiSelectBox.tsx src/components/common/SearchableSelectMenu.tsx src/components/common/useDismissibleDropdown.ts src/components/common/select.types.ts src/components/common/select.utils.ts src/features/documents/components/DocumentFilter.tsx
  bunx prettier --check src/components/common/SelectBox.tsx src/components/common/MultiSelectBox.tsx src/components/common/SearchableSelectMenu.tsx src/components/common/useDismissibleDropdown.ts src/components/common/select.types.ts src/components/common/select.utils.ts src/features/documents/components/DocumentFilter.tsx
  ```

- [ ] **Step 2: Run repository diff validation**

  Run from the repository root: `git diff --check`.

- [ ] **Step 3: Update the SDD ledger**

  Record actual test counts and any unrelated baseline lint findings in `.superpowers/sdd/2026-11-22-common-select-components/progress.md`.

