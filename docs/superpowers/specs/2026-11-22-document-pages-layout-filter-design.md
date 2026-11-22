# Document pages layout and filter design

## Intent

Improve the document browsing and upload pages so their content is visually separated from the shared header/sidebar, and make document discovery support multiple collection and tag selections.

## Goals

- Add consistent responsive padding directly to the two document page shells without changing shared layout behavior.
- Keep upload feedback focused on the progress bar while the file is being sent.
- Extract a reusable `DocumentFilter` component with:
  - text search over collection name, slug, description, and keywords;
  - multi-select collection checkboxes;
  - multi-select tag checkboxes;
  - clear-all behavior and visible selected counts.
- Preserve current collection cards, upload navigation, loading/error states, keyboard access, and existing design tokens.

## Non-goals

- No backend API or database changes.
- No change to document approval, upload, or storage behavior.
- No new UI library or dependency.

## Approaches

1. Keep filter state and markup inside `DocumentsPage`. This is the smallest diff but keeps the page responsible for a growing interactive control.
2. Create a controlled `DocumentFilter` component under `features/documents/components`, with `value` and `onChange` props owned by `DocumentsPage`. This keeps filtering behavior testable and makes the control reusable; this is the approved approach.

## Interaction and responsive decisions

- The filter is a bordered surface below the page introduction, with search full width and collection/tag groups arranged in responsive columns.
- Checkbox labels use minimum touch-friendly height and preserve visible focus rings.
- Multiple selected values are combined with OR within a group and AND across collection/tag/search criteria.
- Empty selections mean “all” for that group.
- Each document page owns its padding so unrelated routes keep their existing layout spacing.
