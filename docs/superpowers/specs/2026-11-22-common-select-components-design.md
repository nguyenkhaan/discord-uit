# Common SelectBox and MultiSelectBox design

## Intent

Replace the inline collection/tag checkbox lists on `/documents` with compact,
searchable dropdown controls that are easier to scan and reusable across the
frontend.

## Goals

- Add `SelectBox` for one selected option.
- Add `MultiSelectBox` for zero or more selected options.
- Keep both components controlled and generic over string values.
- Show a small search input inside the opened menu.
- Support click-outside closing, `Escape`, keyboard focus, and visible focus
  states.
- Preserve the existing document filter semantics: collection selections use
  OR, tag selections use OR, and collection/tag groups combine with AND.
- Keep the existing Tailwind/Lucide visual language without a new dependency.

## Non-goals

- No async option loading or server-side search in this slice.
- No changes to shared `MainLayout` spacing.
- No change to the backend filter contract.

## API and behavior

`src/components/common/SelectBox.tsx` and
`src/components/common/MultiSelectBox.tsx` will share an option shape:

```ts
interface SelectOption {
    label: string;
    value: string;
    description?: string;
    disabled?: boolean;
}
```

The single-select value is `string | null`; the multi-select value is
`string[]`. Both accept a label, placeholder, search placeholder, disabled
state, and `onChange` callback. The menu is anchored to the trigger width,
has a bounded scroll area, and displays a no-results state after search.

`MultiSelectBox` keeps the trigger concise: no selection shows the placeholder,
one selection shows its label, and multiple selections show a count plus the
first selected label. Selected options remain visible when search is cleared,
and clicking an option toggles it without closing the menu. `SelectBox` closes
after a selection.

## Implementation choice

The components will use a small shared internal dropdown primitive rather than
duplicating outside-click, keyboard, and search behavior. The primitive will
stay private to `src/components/common`; only `SelectBox` and `MultiSelectBox`
are public exports for now.

## `/documents` integration

`DocumentFilter` will retain the text search field and replace the visible
checkbox panels with two `MultiSelectBox` instances. Collection and tag options
will include document counts as descriptions. Clearing either control updates
the existing `DocumentFilterValue` and preserves the current result filtering.

## Verification

- Add focused tests for option filtering, single-select selection, multi-select
  toggling, clear behavior, and empty search results.
- Run the full frontend test suite, type-check, build, targeted lint, and
  formatting checks.
