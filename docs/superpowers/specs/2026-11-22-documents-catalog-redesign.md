# Documents catalog redesign

## Intent

Redesign `/documents` around the supplied `DocumentInventory.jpg` reference:
make the library feel like a real catalog, keep filtering compact on the right,
and replace the current collection cards-only view with a featured area plus a
paginated “Tất cả collection” table.

## Goals

- Build the banner with HTML, Tailwind CSS, and Lucide icons; do not embed or
  crop the reference image.
- Keep the existing brand tokens and responsive page padding.
- Put the existing document filter in a compact sticky right rail on desktop,
  with a stacked layout on mobile.
- Use `MultiSelectBox` for collection/tag filters and `SelectBox` for sorting.
- Replace full-page spinner loading with section skeletons using the shared
  `Skeleton` component.
- Filter collections by search, selected collections, and selected tags, then
  paginate the filtered result list in the UI.
- Update frontend guidance in `app/frontend/AGENTS.md` for shared select usage
  and skeleton-first loading states.

## Data decision

The current public API already returns paginated taxonomy collections but only
supports one text query server-side. For this screen, load the public collection
catalog with the existing bounded public taxonomy query, apply the existing
multi-filter semantics in the client, then paginate the filtered collection
list at eight rows per page. This keeps multi-select filtering correct without
introducing a partial server-side filter contract.

## Non-goals

- Do not add a new backend document-list endpoint.
- Do not use the reference image as a runtime asset.
- Do not change `MainLayout` spacing.
- Do not replace compact semantic status/error colors elsewhere in the product.

## Layout

The page contains a header/action row, a horizontal collection category rail,
and a two-column catalog area. The main column contains the CSS banner,
featured collection cards, and the paginated table. The right rail contains the
compact filter and stays sticky on large screens. On small screens the filter
appears above the main catalog and the table scrolls horizontally when needed.

## Loading and accessibility

Skeletons mirror the header, banner, featured cards, filter rail, and table
shapes. Errors remain transparent text/icon states with retry actions. The
shared select menu keeps its search field outside the ARIA listbox, closes on
Escape/outside pointer/focus leaving the menu, and exposes keyboard-friendly
option buttons.
