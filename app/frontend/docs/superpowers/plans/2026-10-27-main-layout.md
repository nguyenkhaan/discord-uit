# Main Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the reusable UIT Connect application shell with a responsive sidebar, the existing Header enhanced with search and user identity, and a content slot for `children`.

**Architecture:** `MainLayout` owns the mobile navigation state and composes the existing `Header` with a new `Sidebar`. `Sidebar` owns only navigation rendering; `Header` reuses `Logo`, `Input`, and `NotificationBell` and reports menu-button clicks through a callback.

**Tech Stack:** React 19, TypeScript strict, React Router, Tailwind CSS v4, lucide-react, Bun tests.

**Spec:** `docs/superpowers/specs/2026-10-27-main-layout-design.md`

## Global Constraints

- Work only inside `app/frontend` and follow its `AGENTS.md`.
- Keep `src/components/Header/Header.tsx`; do not replace it with a second Header component.
- Reuse `Logo`, `Input`, and `NotificationBell`; add no dependencies.
- Navigation labels are exactly `Trang chủ`, `Server`, `Tài liệu`, `Diễn đàn`, and `Thông báo`.
- Header identity is hardcoded as `Cloudian` with a blue circular avatar.

## Review Focus

- A narrow viewport must not retain an always-visible sidebar or create horizontal page scrolling; covered by layout class assertions.
- Every icon-only control must retain an accessible name; covered by Header and Sidebar markup assertions.
- The active navigation item must follow the current URL rather than a hardcoded selection; covered with multiple router locations.
- Existing standalone `<Header />` callers must continue compiling; covered by making `onMenuClick` optional and by the build.
- `children` must render once in the content region; covered by the MainLayout test.

---

### Task 1: Responsive navigation Sidebar

**Files:**

- Create: `src/components/layout/Sidebar.tsx`
- Test: `tests/components/layout/Sidebar.test.tsx`

**Interfaces:**

- Consumes: React Router `NavLink`, existing `Logo`, and `lucide-react` icons.
- Produces: `Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void })`.

- [ ] Write static-render tests for all five links, URL-derived active state, Logo reuse, and the close control's accessible label.
- [ ] Run `bun test tests/components/layout/Sidebar.test.tsx` and verify failure because the component does not exist.
- [ ] Implement the minimal responsive `Sidebar` using semantic navigation, desktop fixed visibility, mobile drawer transforms, and backdrop.
- [ ] Run the Sidebar test and verify it passes.

### Task 2: Enhance the existing Header

**Files:**

- Modify: `src/components/Header/Header.tsx`
- Test: `tests/components/Header/Header.test.tsx`

**Interfaces:**

- Consumes: existing `Logo`, `Input`, `NotificationBell`, plus `Menu` and `Search` icons.
- Produces: `Header({ onMenuClick? }: { onMenuClick?: () => void })`.

- [ ] Write a static-render test for the mobile menu accessible name, reused Logo, search placeholder, notification UI, blue avatar, and `Cloudian` text.
- [ ] Run `bun test tests/components/Header/Header.test.tsx` and verify the expected markup is missing.
- [ ] Update the existing Header with responsive layout and the exact UI content from the spec.
- [ ] Run the Header test and verify it passes.

### Task 3: Compose MainLayout and preserve callers

**Files:**

- Create: `src/components/layout/MainLayout.tsx`
- Modify: `src/routes/AppRoutes.tsx`
- Test: `tests/components/layout/MainLayout.test.tsx`

**Interfaces:**

- Consumes: `Header`, `Sidebar`, and `PropsWithChildren`.
- Produces: `MainLayout({ children }: PropsWithChildren)`.

- [ ] Write a static-render test proving `children` appear once inside `<main>` and the shell contains Header and Sidebar landmarks.
- [ ] Run `bun test tests/components/layout/MainLayout.test.tsx` and verify failure because MainLayout does not exist.
- [ ] Implement MainLayout state/composition and keep AppRoutes imports pointing to the existing Header path.
- [ ] Run all layout tests, then `bun run lint` and `bun run build`; all commands must pass.
