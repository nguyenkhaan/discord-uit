No files have been changed yet. Before implementation, I will do the following:

1. Establish the source of truth

- Treat `screen_outline.md` as the authority for features, fields, states, permissions, and mock-data shape.
- Treat `theme.md` as the authority for colors, typography, spacing, radii, focus treatment, light/dark themes, and motion.
- Preserve all existing required interactions: dialogs, drawers, filters, reporting, moderation states, uploads, calls, comments, notifications, and theme persistence.

2. Reconcile the layout requirements

There is one important conflict: `theme.md` says not to copy Discord layouts, while your newer instruction explicitly requires a Discord-style primary icon rail. Your instruction takes precedence for layout modernization.

I will therefore:

- Add the requested far-left navigation rail for Servers, Documents, and Forum.
- Not invent unsupported features such as direct messages, multiple server channels, public server discovery, or conversation records.
- Apply Messenger-like chat composition only to U02/U03 where appropriate: message stream, composer tools, and member/details panel.
- Preserve the single shared server chat required by the schema instead of fabricating channel data.

3. Refactor each prototype by its actual task

- U01: workspace rail plus responsive personal-server collection.
- U02: rail, contextual server sidebar, central chat, call banner, composer, and member/management panel.
- U03: Meet/Zoom-style media grid, pre-join state, screen-share stage, side panel, and persistent call controls.
- U04: document discovery workspace with search, filters, and responsive result cards.
- U05: focused reading view with document preview and metadata/action rail.
- U06: guided upload, details, review, processing, rejection, and resubmission flow.
- U07: documents/posts status workspace with filters, history, reasons, and next actions.
- U08: Facebook/Reddit-style approved-post feed with search, topics, reactions, and clear author treatment.
- U09: readable post detail with shallow threaded comments, reactions, sharing, reporting, and anonymous identity rules.
- U10: focused post editor with formatting tools, topics, anonymity disclosure, preview, submission, and unsaved-change protection.

4. Convert everything to English

This includes:

- `<html lang="en">`, page titles, headings, navigation, labels, placeholders, buttons, helper text, statuses, dialogs, drawers, notifications, tooltips, ARIA labels, validation messages, JavaScript-generated strings, and mock data.
- A final repository scan for remaining Vietnamese text in all ten files.

5. Apply one coherent visual system

- Reuse the exact semantic palette from `theme.md`.
- Standardize the icon rail, headers, controls, cards, sidebars, dialogs, drawers, badges, and empty/error states.
- Keep Inter typography, the specified spacing scale, restrained elevation, and defined radii.
- Retain light/dark theme behavior and persisted user preference.
- Add purposeful 120–180 ms interaction feedback and reduced-motion handling.
- Use SVG icons with accessible labels rather than emoji or ambiguous glyphs.
- Add no dependency or new framework.

6. Harden accessibility and responsiveness

- Use semantic landmarks and heading order.
- Preserve visible focus rings and keyboard access.
- Ensure icon-only controls have accessible names.
- Maintain 44 px mobile touch targets.
- Associate every form field, error, and anonymity disclosure correctly.
- Support dialogs with Escape, focus entry, and focus restoration.
- Validate layouts at 320, 768, 1024, and 1440 px without removing required actions.

7. Perform bounded final verification

- Inspect desktop and mobile versions of all ten screens in one audit pass.
- Fix detected overflow, hierarchy, contrast, focus, interaction, and copy issues together.
- Run a second confirmation pass only if needed.
- Verify required fields and states against `screen_outline.md`.
- Check for English-only UI, console errors, broken controls, inaccessible labels, missing reduced-motion behavior, and inconsistent theme tokens.

The `/improve` workflow is being used for this read-only scope and audit phase. Implementation will proceed under the frontend engineering and Impeccable workflows after this checkpoint.

Skipped so far: no HTML edits, browser screenshots, or interaction tests have been performed.
Main risk: the requested Discord-inspired shell must stay visual only; adding real channels or DMs would violate the documented product schema.

**File has been edited**: 

"This is the list of files that have been edited and UI-validated by users. Please reference their theme and layout to synchronize the subsequent pages. Remember that the ULTIMATE REQUIREMENTS WHEN READ THESE FILES IS SYNCHRONIZE, NOT COPY THEIR DESIGN UI AND BRING TO NEW PAGES FORMUNIALLY. 

- U01_ServerListPage.html
