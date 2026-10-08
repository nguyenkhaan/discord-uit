# UIT Connect — Theme & UI Design System

## Project Overview & Theme Objectives

UIT Connect is a private collaboration space for students: server-based group chat and calls, a moderated document library, a moderated forum, notifications, reporting, and an administrator workspace. Its interface must make three things immediately legible: **where the user is**, **what state content is in**, and **what action is permitted**.

The visual direction borrows only the design language observed in the supplied Discord UI Kit Figma file: a confident periwinkle action color, deep neutral surfaces, dense-but-readable information hierarchy, compact controls, rounded surfaces, and clear status colors. It deliberately does **not** reuse Discord's server rail, channel hierarchy, screen layout, component arrangement, or navigation model. UIT Connect's information architecture follows its own product flows and the screen list.

Design objectives:

- Keep private server collaboration focused without implying public-server discovery or direct messages.
- Make moderation, pending review, rejection, report access, and audit-sensitive actions visibly distinct from normal user actions.
- Support long lists, filters, search, document metadata, and administrative decisions without visual noise.
- Offer an equally intentional light and dark mode; respect the OS preference on first visit and retain the user's explicit choice.
- Meet WCAG 2.2 AA: normal text contrast of at least 4.5:1, visible keyboard focus, target controls at least 44 × 44 px where practical, and no information conveyed by color alone.

## Color Palette

The primary palette is adapted from the reference's cool-indigo, dark-neutral visual character. Use semantic tokens in implementation rather than raw colors.

| Role | Token | Hex | RGB | Use |
| --- | --- | --- | --- | --- |
| Primary | `--color-primary` | `#5865F2` | `rgb(88, 101, 242)` | Primary actions, selected navigation, links, focus ring |
| Primary hover | `--color-primary-hover` | `#4752C4` | `rgb(71, 82, 196)` | Hover/pressed primary controls |
| Primary soft | `--color-primary-soft` | `#E8EAFE` | `rgb(232, 234, 254)` | Light-mode selected/notice backgrounds |
| Secondary | `--color-secondary` | `#3BA55D` | `rgb(59, 165, 93)` | Join, approved, active-call and positive secondary actions |
| Dark canvas | `--color-canvas-dark` | `#1E1F22` | `rgb(30, 31, 34)` | Dark app background |
| Dark surface | `--color-surface-dark` | `#2B2D31` | `rgb(43, 45, 49)` | Dark cards, panels, composer |
| Dark raised | `--color-raised-dark` | `#313338` | `rgb(49, 51, 56)` | Dark headers, menus, hoverable raised areas |
| Light canvas | `--color-canvas-light` | `#F2F3F5` | `rgb(242, 243, 245)` | Light app background |
| Light surface | `--color-surface-light` | `#FFFFFF` | `rgb(255, 255, 255)` | Cards, dialogs, input surfaces |
| Light muted surface | `--color-muted-light` | `#E3E5E8` | `rgb(227, 229, 232)` | Dividers, skeletons, subdued areas |
| Text on dark | `--color-text-on-dark` | `#F2F3F5` | `rgb(242, 243, 245)` | Primary dark-mode text |
| Text primary | `--color-text-primary` | `#060607` | `rgb(6, 6, 7)` | Primary light-mode text |
| Text muted | `--color-text-muted` | `#80848E` | `rgb(128, 132, 142)` | Supporting copy, metadata, disabled text |
| Text subdued | `--color-text-subdued` | `#B5BAC1` | `rgb(181, 186, 193)` | Supporting text on dark surfaces |
| Border | `--color-border` | `#DCDDDE` | `rgb(220, 221, 222)` | Light borders; use `#3F4147` in dark mode |
| Success | `--color-success` | `#23A559` | `rgb(35, 165, 89)` | Approved, resolved, online, upload complete |
| Warning | `--color-warning` | `#F0B232` | `rgb(240, 178, 50)` | Pending review, expiring invite, caution |
| Danger | `--color-danger` | `#F23F42` | `rgb(242, 63, 66)` | Rejected, banned, destructive actions, errors |
| Info | `--color-info` | `#5865F2` | `rgb(88, 101, 242)` | Informational notices and progress |
| Accent | `--color-accent` | `#EB459E` | `rgb(235, 69, 158)` | Rare highlights only; never a sole status indicator |

### Color application rules

- Default to a light content workspace for documents, forum, account, and administration; dark mode is a full token swap, not an inverted screenshot.
- Server chat and active calls may default to dark mode for focus, but must retain the same semantic colors and offer the user theme preference.
- Use `success`, `warning`, and `danger` only for state or consequence. Pair each with text/icon labels such as “Đã duyệt”, “Chờ duyệt”, or “Từ chối”.
- Never use the primary indigo for destructive actions. The final destructive confirmation uses danger styling and a plain-language consequence.

## Typography System

Use `Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`. Inter preserves the reference's clean, compact neo-grotesque feel while supporting Vietnamese diacritics and consistent web rendering. Use tabular figures for timestamps, counts, and audit-log tables.

| Style | Size / line-height | Weight | Usage |
| --- | --- | --- | --- |
| Display | 32 / 40 px | 700 | Marketing-free page titles only; auth welcome |
| H1 | 28 / 36 px | 700 | Page title, e.g. “Kho tài liệu” |
| H2 | 22 / 30 px | 650–700 | Major panel/section heading |
| H3 | 18 / 26 px | 600–700 | Card title, dialog title, server name |
| H4 / label heading | 14 / 20 px | 700 | Group label, table section label; sentence case |
| Body | 16 / 24 px | 400 | Default reading text, post/comment body |
| Body compact | 14 / 20 px | 400–500 | Forms, lists, chat, metadata-rich views |
| Small | 12 / 16 px | 500 | Timestamps, helper text, badges |
| Button / nav | 14 / 20 px | 600 | Buttons and navigation labels |

Use sentence case in Vietnamese, not all caps, except short status chips where 12 px/700 is acceptable. Body text must remain at least 14 px in dense desktop tables and at least 16 px in mobile forms. Paragraph width should be 60–75 characters in article/detail views.

## Layout & Grid System

### Global shells

| Context | Structure tailored to product flow |
| --- | --- |
| Guest/authentication | Centered single-column card over a quiet indigo-to-neutral gradient. UIT SSO and personal-email paths are sibling actions, not visually different products. |
| User workspace | A 64 px top header with product mark, global destinations (Servers, Documents, Forum), search when relevant, notifications, theme toggle, and account menu. Use a contextual secondary nav only where the area has related views. |
| Server workspace | Server title/action bar; adaptive main area with chat as the primary pane and an on-demand member/details panel. Call status is a clear contextual banner/action, not a copied channel navigation system. |
| Call workspace | A full-height media stage, participant strip/grid, persistent in-call controls, and a collapsible server-chat panel. Clearly label the Coordinator-only controls. |
| Admin workspace | Left admin navigation on desktop and a compact drawer on mobile; a wide content panel with page title, filter/action row, data table or review workspace. Sensitive reads need a reason/confirmation step. |

### Grid, spacing, and responsive rules

- Base spacing unit: 4 px. Standard scale: 4, 8, 12, 16, 24, 32, 40, 48, 64 px. Use 16 px internal card padding on compact surfaces and 24 px on standard desktop cards.
- Content max-width: 1280 px for library/forum/admin list pages; 760 px reading column for document/post details; no max-width for the call stage.
- Desktop (≥1280 px): 12-column grid, 24 px gutters, 32 px outer margin. Tablet (768–1279 px): 8 columns, 20 px gutters, 24 px margin. Mobile (<768 px): 4 columns, 16 px gutters, 16 px margin.
- Breakpoints: compact mobile `<480`, mobile `480–767`, tablet `768–1023`, desktop `1024–1439`, wide `≥1440`. Do not hide an authorization-critical action at a breakpoint; move it into a labelled overflow menu only when discoverable.
- Use `grid` for page/card collections and analytics; use flexbox for headers, toolbars, form rows, button groups, and inline metadata. Collapse a two-column form/review layout to one column below 768 px.
- Page rhythm: 24 px between title area and content; 16 px between related controls; 32 px between major sections. Avoid decorative empty space that hides the current state or required action.

## Component Design System

### Foundations

- Radius: 8 px for controls, 12 px for cards/panels, 16 px for dialogs and media surfaces, pill only for compact tags/badges.
- Elevation: subtle 1 px border by default; `0 8px 24px rgba(0,0,0,.14)` for menus/dialogs. Do not stack heavy shadows.
- Motion: 120–180 ms ease-out for hover, drawer, toast, and menu transitions. Respect `prefers-reduced-motion`; never animate a status change as the only feedback.
- Focus: 2 px `#FFFFFF` inner plus 2 px `#5865F2` outer ring on dark surfaces; use the indigo outer ring with sufficient contrast on light surfaces.

### Components

| Component | Specification |
| --- | --- |
| Buttons | Heights: 40 px default, 36 px compact, 44 px touch/mobile. Variants: primary indigo, secondary neutral, positive green only for explicit join/approve actions, danger outline/filled for irreversible action, and ghost for low-emphasis actions. Loading state preserves the label width and announces progress. |
| Inputs and select controls | 40 px minimum height; 8 px radius; visible label above the input; helper/error text below. Error uses danger border plus an icon/text message. Search fields have an accessible label even when visually represented by an icon. |
| Cards | Surface + border, 12 px radius, 16–24 px padding. Use document/post cards for summary and metadata; cards must not hide primary actions on hover only. |
| Navigation | Active destination uses an indigo indicator plus stronger text, not color alone. Header destinations are product-level; contextual tabs cover settings, “Nội dung của tôi”, and admin subsections. Mobile navigation prioritizes Servers, Documents, Forum, Notifications, and Account. |
| Chat message | Avatar/identity, timestamp, content, edit marker, reactions, and explicit linked-content preview. Own-message edit/delete and owner moderation actions appear through a labelled context menu; deleted content is replaced by a neutral state, never silently removed. |
| Call controls | High-contrast persistent bottom dock: microphone, camera, share screen, chat, leave. Leave is danger; Coordinator actions are separated and labelled “Điều phối”. Show participant count and the one-active-sharer constraint. |
| Document/post metadata | Collection/topic chips, author/anonymous alias, review status, date, and actions occupy a predictable metadata row. A pending/rejected state cannot look public or downloadable. |
| Tables and filters | Sticky header only for long desktop tables; sortable headers, clear empty result, responsive card/list transformation on mobile. Filters are chips or selects with a “Clear filters” action. |
| Badges/status | Use concise semantic labels: `Đang xử lý`, `Chờ duyệt`, `Đã duyệt`, `Từ chối`, `Đã gỡ`, `Mở`, `Đang xử lý`, `Đã giải quyết`, `Đã bác bỏ`. Pair color with text/icon. |
| Modals/drawers | Dialog for a focused confirmation/form; drawer for notifications, members, filters, and server management. Trap focus, restore trigger focus, support Escape unless unsafe, and always provide a labelled close button. |
| Tooltips/toasts | Tooltip supplements an icon; it never contains the only label for an action. Toast confirms non-critical success; errors that require recovery remain inline and actionable. |
| Sensitive-access gate | Before admin reveals report-scoped private chat or anonymous identity, show purpose field, scope summary, audit notice, Cancel, and “Xem dữ liệu liên quan” confirmation. No bulk/private-history browsing UI. |

### Shared states

Every async region supplies loading (skeleton), empty (explain + next action), error (reason + retry where safe), and permission-denied states. Preserve form content on recoverable errors. Use optimistic UI only for reversible actions such as reactions; do not optimistically show moderation, invitation redemption, destructive, or audit-sensitive outcomes.

## Screen Layout Guidelines

The following maps the custom UIT Connect layout—not Discord layouts—to every screen in `screen_list.md`.

| Screens | Layout and visual guidance |
| --- | --- |
| **A01 Login, A02 Register** | Guest shell; 420–480 px form card, concise trust/privacy copy, and a clear divider between personal-email flow and UIT SSO. Registration warns inline that `@uit.edu.vn` uses SSO. |
| **A03 Verify email, A04 Forgot password, A05 Reset password, A06 UIT callback** | Guest shell with a single state card. Verification/callback states use success, warning, or error icon + text; forgotten-password confirmation stays deliberately generic. |
| **A07 Invite** | Guest-or-user shell with a server summary card: avatar, name, owner/size metadata only as permitted, expiry/use status, and one join/continue action. Invalid, revoked, exhausted, and already-member states replace the action clearly. |
| **A08 Account settings** | User shell with settings tabs/drawer, profile overview, sections for profile, credentials, and email verification. Sensitive values are masked by default; password/change-email flows are isolated dialogs or dedicated sections. |
| **U01 Server list** | User shell; personal-server collection in responsive cards/list plus a prominent “Tạo server” action. Do not render a public discovery/search catalogue. Empty state explains private invitations. |
| **U02 Server chat** | Server workspace: title/action bar, one shared chat stream, pinned call-state banner, composer anchored at bottom, and collapsible members/owner-management drawer. Linked document/forum previews retain their source identity. |
| **U03 Server call** | Call workspace: media stage first, participant grid, visible device/join state, compact chat drawer, and persistent controls. Coordinator-only force mute/stop-share controls are visually segregated and disabled when the Coordinator is absent. |
| **U04 Document library** | User shell; title/search/filter row then a 3/2/1-column responsive document grid or result list. Search supports title, tag, collection, and OCR; only approved public documents appear. |
| **U05 Document detail** | Reading layout with document preview/content column and a desktop metadata/action rail that stacks on mobile. Download, share to server, and report are separate, explicit actions. |
| **U06 Submission/resubmission** | Guided single-column form: file upload → title/tags → review → processing status. Rejected resubmission foregrounds the previous reason but creates a new submission. |
| **U07 My content** | User shell with two tabs (Documents, Posts), filterable status lists, reason visibility for rejected items, and contextual edit/resubmit actions. Never mix public-library results with private submission states. |
| **U08 Forum feed** | User shell; search/topics/action bar, readable post feed with topic chips and author/anonymous alias treatment. “Viết bài” is prominent; only approved posts enter the feed. |
| **U09 Forum post** | 760 px reading column with a secondary metadata/action rail on desktop. Comments form a threaded but shallow, readable sequence; anonymous alias is displayed consistently within that post only. |
| **U10 Forum editor** | Focused editor layout with title, body, free-form topic chips, anonymous-toggle explanation, preview/save/submit controls, and explicit “sẽ gửi duyệt” state on submission or edit. |
| **M01 Admin overview** | Admin shell; finite operational summary cards (open reports, pending documents/posts) and queue shortcuts. Avoid vanity dashboards or sensitive-content previews. |
| **M02 Reports, M03 Report detail** | Reports uses filters + a status table/list. Detail uses evidence/action split view; sensitive context stays behind the audited purpose gate, and resolution state/action sits in a sticky decision panel. |
| **M04 Accounts, M05 Servers** | Admin shell; searchable data tables that transform to record cards on mobile. Account status and server enforcement actions show scope, reason input, and destructive confirmation; no general private-chat viewer. |
| **M06 Documents, M07 Document review, M08 Document taxonomy** | Queue table for submissions; review workspace compares file/OCR/agent suggestion with final collection/tag decision. Taxonomy uses a manageable collection/category tree and inline create/edit forms—not a generic server/channel structure. |
| **M09 Forum moderation** | Split queue/detail pattern with post body, reports, AI suggestion labelled as non-binding, and explicit approve/reject/edit/remove actions. Anonymous-identity reveal remains audit-gated. |
| **M10 Audit logs** | Read-only, filter-first table with actor, action, target, purpose, timestamp, and immutable event detail. Do not allow inline edit/delete and do not reveal unrelated private content. |

## Implementation Notes and Non-goals

- Build tokens as CSS custom properties with `[data-theme="light"]` and `[data-theme="dark"]`; components consume semantic roles, never page-specific hex values.
- Reuse the same form, list, modal, badge, empty-state, and sensitive-access patterns across user and admin routes. Server, call, document, forum, and admin layouts remain distinct because their tasks differ.
- This document intentionally excludes a public server directory, direct messages, multiple server channels, concurrent server calls, call recording, or admin call surveillance because these are out of product scope.
- Treat interface visibility as usability only: the backend remains the authority for account state, membership, Owner/Coordinator/Admin permissions, moderation, and sensitive-data access.
