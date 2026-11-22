# Admin Document Size and Taxonomy Editing Design

## Intent

Admin cần xem đúng kích thước file và có thể quản lý taxonomy của tài liệu ngay trên trang chi tiết/review. Một tài liệu có thể thuộc nhiều collection và nhiều tag; thao tác chỉnh sửa phải rõ ràng, tìm kiếm được và lưu nhất quán.

## Goals

- Hiển thị kích thước nhỏ theo B/KB thay vì làm tròn thành `0.0 MB`.
- Thêm API admin để thay thế toàn bộ danh sách collection/tag của một document trong một transaction.
- Trên trang `/admin/documents/:id`, hiển thị danh sách đang gán và cho phép chọn nhiều collection/tag bằng `MultiSelectBox` dùng chung.
- Lưu taxonomy một lần, cập nhật lại danh sách submissions/query cache và thông báo thành công/lỗi.
- Cho phép lưu cả danh sách rỗng để bỏ phân loại.
- Cho phép chỉnh taxonomy với mọi trạng thái submission hiện có; taxonomy thuộc về `Document`, không thuộc riêng một lần submission.

## Non-goals

- Không thay đổi nội dung file, trạng thái duyệt hoặc quyền truy cập tài liệu.
- Không tạo collection/tag mới trong màn hình review.
- Không tách API thành các request add/remove riêng lẻ.

## Constraints

- Backend dùng Spring Boot/JPA/PostgreSQL và các bảng `document_collection`, `document_tag` hiện có.
- Frontend dùng React, TypeScript strict, TanStack Query, Axios và Tailwind tokens.
- Phải dùng `MultiSelectBox` tại `src/components/common/MultiSelectBox.tsx`; không tạo dropdown riêng.
- API service/hook tách khỏi page; OpenAPI contract là file sinh tự động, không sửa thủ công.
- Không commit trong lượt triển khai này.

## Approaches

1. **Thay thế toàn bộ taxonomy qua một PATCH (được chọn):** `PATCH /admin/documents/{documentId}/taxonomy` nhận `collectionSlugs` và `tagSlugs`, backend validate tất cả slug, xóa association cũ rồi tạo association mới trong cùng transaction. UI giữ bản nháp cục bộ và lưu một lần. Cách này phản ánh đúng ý nghĩa “danh sách hiện tại” và tránh trạng thái dở dang.
2. **API add/remove từng association:** mỗi click tạo request riêng. Cách này nhiều round-trip, khó rollback khi một request lỗi và không phù hợp với thao tác chọn nhiều rồi lưu.
3. **Gắn taxonomy vào API review:** trộn metadata với quyết định duyệt, không dùng được khi admin muốn chỉnh tài liệu đã duyệt/từ chối và làm contract review khó hiểu.

## UX and layout

- Khu vực `Taxonomy` nằm trong cột thông tin bên trái của trang review.
- Phần đầu hiển thị hai nhóm “Collections đang gán” và “Tags đang gán” bằng chip có tên hiển thị; trạng thái rỗng dùng copy rõ ràng.
- Bên dưới là hai `MultiSelectBox` xếp dọc: “Chọn collections” và “Chọn tags”. Menu có search theo component dùng chung.
- Nút `Lưu phân loại` đặt cuối khu vực taxonomy, disabled khi chưa có thay đổi hoặc đang lưu; khi lưu lỗi giữ nguyên lựa chọn nháp để retry.
- Khi taxonomy đang tải, chỉ skeleton trong card taxonomy; header, metadata, preview không bị thay bằng loading toàn trang.
- Chip và option ưu tiên tên hiển thị; nếu taxonomy hiện tại không còn trong danh sách tải về thì dùng slug làm fallback để không làm mất thông tin đang gán.

## API contract

### Request

`PATCH /admin/documents/{documentId}/taxonomy`

```json
{
  "collectionSlugs": ["ai-research", "software-engineering"],
  "tagSlugs": ["machine-learning", "research"]
}
```

Both arrays are optional at the transport level but normalized to empty lists by the service; duplicate values are removed while preserving order. Each list accepts at most 100 values and blank values are rejected. Unknown collection/tag slug returns `400`. Unknown document returns `404`.

### Response

Return a focused taxonomy response with `documentId`, sorted `collectionSlugs`, and sorted `tagSlugs`. The frontend invalidates the existing admin submissions query after success, while the focused response keeps this metadata endpoint independent from submission history.

## Data consistency

The service loads the document, resolves all requested slugs, deletes existing document associations, flushes deletes, then inserts the deduplicated links. The whole method is transactional; if validation or persistence fails, the original associations remain because the transaction rolls back. This applies equally to pending, approved, and rejected submissions because the links belong to the document.

## Size formatting

Create a shared frontend formatter for byte counts: bytes below 1024 use `B`, values below 1 MiB use one decimal `KB`, values below 1 GiB use one decimal `MB`, and larger values use one decimal `GB`. Use it on the admin list and detail/review page. Backend upload tests continue to assert that the stored size equals the uploaded byte length.

## Verification

- Backend unit tests cover replacing multiple collections/tags, clearing both lists, unknown slug rejection, and preserving persistence semantics through the transaction boundary.
- Frontend tests cover size formatting and taxonomy service payload mapping; existing type-check, lint, build, and test suites must pass.
- Regenerate `app/frontend/src/contract/api-contract.ts` from the running backend OpenAPI endpoint when available; otherwise the service uses an explicit local request/response type until generation can be run.

## Shared dropdown behavior

The existing `SelectBox` and `MultiSelectBox` must close when their open trigger is clicked again. The trigger state transition must not reopen the menu after `SearchableSelectMenu` closes itself through `blur`.
