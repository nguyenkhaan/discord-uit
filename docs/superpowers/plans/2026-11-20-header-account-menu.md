# Header Account Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Khôi phục dropdown tài khoản trên avatar header và nối lựa chọn `Logout` với API logout hiện có.

**Architecture:** Giữ nguyên `privateClient`, `auth.service.logout()` và `AuthProvider.logout()`. Sửa trực tiếp `Avatar` thành account menu có state mở/đóng cục bộ, dùng `useAuth()` để logout và `useNavigate()` để về `/login`; không refactor menu admin hay tạo route profile.

**Tech Stack:** React 19, TypeScript strict, React Router, TanStack Query, Axios, Tailwind CSS, Node test runner.

**Spec:** `docs/superpowers/specs/2026-11-20-header-account-menu-design.md`

## Global Constraints

- Không thêm dependency, endpoint hoặc thay đổi generated `src/contract/api-contract.ts`.
- API calls chỉ nằm trong feature service; component chỉ gọi `useAuth()`.
- Dùng Tailwind/token hiện có, semantic button/menu và giữ focus/accessibility behavior.
- `bun run build`, `bun run lint` và `bun test` phải chạy trong `app/frontend`.

## Review Focus

- Logout API lỗi: local session vẫn phải được clear và user vẫn phải được đưa về `/login`; kiểm thử service route riêng và giữ flow `finally` hiện có trong provider.
- Click avatar nhiều lần: menu chỉ toggle, không tạo nhiều request; trạng thái loading phải chặn submit lặp.
- Click ngoài/Escape: menu đóng và Escape trả focus về avatar.
- Dữ liệu `/me` thiếu hoặc không có: avatar vẫn render với fallback `Cloudian`/`C`.
- Header không có `AuthProvider` trong test/render cô lập: test phải cung cấp context hợp lệ thay vì tạo fallback auth logic trong component.

### Task 1: Cover the existing logout service contract

**Files:**
- Modify: `app/frontend/tests/features/auth/auth.service.test.ts`

**Interfaces:**
- Consumes: `logout(): Promise<void>` from `@/features/auth/auth.service`.
- Produces: regression coverage that `privateClient.post` receives `['/auth/logout']`.

**Acceptance Criteria:**
- Test proves logout sends a POST to `/auth/logout` using the private client.
- Existing auth service tests remain unchanged in behavior.

- [ ] **Step 1: Add a failing/logout regression test**

  Import `logout`, call it with the existing `mockPrivatePost()` helper, and assert `post.calls` equals `[['/auth/logout']]`.

- [ ] **Step 2: Run the focused test**

  Run: `bun test tests/features/auth/auth.service.test.ts`

  Expected: the logout test passes against the existing implementation; if the current service behavior differs, fix only the service contract needed for this assertion.

### Task 2: Add the header avatar account menu

**Files:**
- Modify: `app/frontend/src/components/Avatar.tsx`
- Modify: `app/frontend/tests/components/Header/Header.test.tsx`
- Modify: `app/frontend/tests/components/layout/MainLayout.test.tsx`
- Modify: `app/frontend/tests/components/layout/Sidebar.test.tsx`

**Interfaces:**
- Consumes: `AuthContextValue.user` and `AuthContextValue.logout()` through `useAuth()`; `useNavigate()` from React Router.
- Produces: the existing default `Avatar` export now renders an accessible avatar trigger with `Profile` and `Logout` menu items.

**Acceptance Criteria:**
- Header shows the current user's full name/initial when available and retains `Cloudian`/`C` fallback when not.
- Trigger exposes `aria-haspopup="menu"`, `aria-expanded`, `aria-controls`, and an account-specific accessible label.
- Open menu contains exactly `Profile` and `Logout`; `Logout` calls `logout()` once, closes the menu, and navigates to `/login` with replace after the promise settles.
- Menu closes on outside pointer down, Escape, and Tab; Escape returns focus to the trigger.
- Logout button is disabled while the request is pending to prevent duplicate calls.

- [ ] **Step 1: Update header tests for the new trigger and menu contract**

  Wrap the static header render with a minimal `AuthContext.Provider` value, then assert the avatar is a button with account label and the closed trigger state. Keep the existing search/notification assertions and add a focused static assertion for the menu labels in the component render path where they are available.

  Update the static `MainLayout` and `Sidebar` test harnesses with the same minimal auth context because both render the shared avatar outside the application-level `AuthProvider`; keep the Sidebar footer assertion aligned with its current `justify-between` layout.

- [ ] **Step 2: Implement the minimal account-menu behavior in `Avatar.tsx`**

  Keep the existing default export. Use the current auth user to derive `displayName`, keep local `isOpen`/`isLoggingOut` state and refs, render the avatar/name as a semantic button, and render the two menu buttons. Reuse existing design tokens/classes and add document listeners only while the menu is open.

- [ ] **Step 3: Run focused frontend tests**

  Run: `bun test tests/components/Header/Header.test.tsx tests/features/auth/auth.service.test.ts`

  Expected: all focused tests pass with no TypeScript/runtime errors.

### Task 3: Verify the frontend slice

**Files:**
- No additional files.

**Interfaces:**
- Consumes: completed header account menu and logout regression coverage.
- Produces: verified build, lint and test results for the frontend.

**Acceptance Criteria:**
- Full frontend test suite, lint and production build exit successfully.

- [ ] **Step 1: Run all tests**

  Run: `bun test`

- [ ] **Step 2: Run lint**

  Run: `bun run lint`

- [ ] **Step 3: Run production build**

  Run: `bun run build`

- [ ] **Step 4: Inspect the final diff**

  Run: `git diff --check && git status --short`

  Confirm only the approved design/plan docs, avatar implementation, and related tests are changed.
