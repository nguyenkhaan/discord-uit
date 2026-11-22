# Admin document preview viewport Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Cố định vùng nội dung preview tài liệu ở chiều cao đọc được như một trang A4 và giữ thao tác cuộn bên trong cho mọi định dạng đang hỗ trợ.

**Architecture:** Giữ phần header của `PreviewPane` cố định, tạo một content viewport responsive có `overflow-y-auto`, rồi truyền chiều cao đầy đủ xuống PDF iframe, DOCX mount, TXT pre và fallback viewer. Không thay đổi API preview/download hay thư viện `docx-preview`.

**Tech Stack:** React, TypeScript, Tailwind CSS, `docx-preview`, Bun test/Vite.

**Spec:** `docs/superpowers/specs/2026-11-22-admin-document-preview-viewport-design.md`

## Global Constraints

- Header `Xem trước` và nút tải file không cuộn cùng nội dung.
- PDF, DOCX, TXT và fallback dùng chung viewport cố định.
- Không thay đổi API preview/download hoặc thư viện `docx-preview`.
- Tái sử dụng token/class Tailwind và giữ accessibility hiện có.

## Review Focus

- DOCX dài: content không được kéo giãn toàn panel; phải cuộn trong viewport.
- PDF: iframe phải lấp đầy viewport và không tạo scroll lồng ngoài ý muốn.
- TXT: văn bản dài phải cuộn được, vẫn giữ xuống dòng dễ đọc.
- Định dạng chưa có viewer: trạng thái fallback phải nằm trong cùng chiều cao cố định.
- Màn hình nhỏ: viewport không gây tràn ngang và vẫn giữ vùng đọc tối thiểu hợp lý.

### Task 1: Cố định viewport cho mọi document viewer

**Files:**
- Modify: `app/frontend/src/features/admin/pages/AdminDocumentReviewPage.tsx:47-190`
- Test: existing frontend type-check/build and targeted lint/format checks

**Interfaces:**
- Consumes: `DocumentPreview`, `renderAsync`, `PreviewPane` hiện có.
- Produces: `DocumentViewer` render mọi định dạng trong viewport có chiều cao cố định; `PreviewPane` tách header cố định khỏi vùng nội dung cuộn.

**Acceptance Criteria:**
- Panel preview không tăng chiều cao theo độ dài tài liệu.
- PDF, DOCX, TXT và fallback đều nằm trong vùng có chiều cao responsive gần một trang A4.
- Chỉ vùng nội dung tài liệu có scroll dọc; header và nút tải file giữ nguyên.
- Không còn `min-height` đơn độc khiến DOCX mount tự mở rộng theo nội dung.

- [x] **Step 1: Update the preview shell**

  Trong `PreviewPane`, giữ header như hiện tại và thay content wrapper bằng viewport responsive dùng chiều cao cố định, `overflow-y-auto`, `min-w-0`, `overscroll-contain`; trạng thái đang tải cũng lấp đầy viewport.

- [x] **Step 2: Make each viewer fill the viewport**

  Cập nhật `DocumentViewer` để PDF iframe dùng `h-full`, DOCX mount dùng `h-full overflow-auto`, TXT pre dùng `h-full overflow-auto`, và fallback dùng `h-full` với layout căn giữa. Giữ `title`, download link và logic fetch/render hiện có.

- [x] **Step 3: Run verification**

  Run: `bun run type-check && bunx eslint src/features/admin/pages/AdminDocumentReviewPage.tsx && bunx prettier --check src/features/admin/pages/AdminDocumentReviewPage.tsx && bun run build`

  Expected: tất cả pass; build chỉ có thể phát cảnh báo chunk size hiện có.

- [x] **Step 4: Run regression tests**

  Run: `bun test`

  Expected: toàn bộ test pass.

