## Phase 5 — Document library, classification, and moderation

### Feature 5.1 — Admin-managed categories and collections

**User story:** DOC-05.

**Database:** `category(id, name, created_at, updated_at)`, `collection(id, name, description, slug, created_at, updated_at)` và `collection_category(collection_id, category_id, created_at)`.

#### Step 5.1.1 — BE

- Thêm admin CRUD và public read API; bảo vệ các thao tác delete có thể làm mất hiệu lực classification link hiện có.

#### Step 5.1.2 — FE

- Xây dựng admin category/collection list, create/edit form, slug validation và category assignment; thêm các primitive để browse public collection.

#### Step 5.1.3 — Integration

- Kết nối CRUD và assignment cùng conflict handling.
- Acceptance: chỉ `system_role = ADMIN` có thể mutate taxonomy, public user có thể read và duplicate name/slug thất bại theo cách có thể dự đoán.

### Feature 5.2 — Private upload, quarantine, scanning, and submission

**User story:** DOC-03.

**Database:** `media(id, uploaded_by_user_id, file_name, mime_type, size_bytes, object_key, status, scan_completed_at, created_at)`, `document(id, uploaded_by_user_id, media_id, title, description, tags, slug, visibility_status, created_at, updated_at, removed_by_user_id, removed_at, removal_reason)` và `document_submission(id, document_id, submitted_by_user_id, status, submitted_at, reviewed_by_user_id, reviewed_at, rejection_reason, purge_at)`.

#### Step 5.2.1 — BE/workers

- Tích hợp private S3-compatible object storage.
- Tạo upload-init endpoint để validate file name, `mime_type` đã khai báo, `size_bytes`, title, description và tag; tạo `media.status = QUARANTINED`, `document.visibility_status = HIDDEN` và `document_submission.status = PENDING_PROCESSING`.
- Trả về signed upload URL short-lived bằng `media.object_key` opaque; khi hoàn tất, verify size/signature và queue malware scanning.
- Set `media.status = SCANNING`, sau đó chuyển thành `READY` kèm `scan_completed_at` hoặc `REJECTED`; file bị reject tuyệt đối không được chuyển sang OCR hoặc public download.

#### Step 5.2.2 — FE

- Xây dựng upload form, direct-to-storage progress, validation, retry và status view “my submissions” bằng `media.status` và `document_submission.status`.
- Tuyệt đối không expose `object_key` dưới dạng permanent public URL.

#### Step 5.2.3 — Integration

- Kết nối init → signed upload → completion → scan status polling/event.
- Acceptance: file invalid/oversized/malicious vẫn private, chỉ uploader/admin thấy pending item và mọi `document.media_id` đều tham chiếu đúng row `media` dự kiến.

### Feature 5.3 — OCR and agent classification recommendation

**User story:** DOC-11.

**Database:** `agent_classification(id, document_submission_id, model_id, classification_run_id, ocr_text, created_at)`, `agent_classification_collection(agent_classification_id, collection_id, confidence, created_at)` và `agent_classification_category(agent_classification_id, category_id, confidence, created_at)`.

#### Step 5.3.1 — BE/workers

- Chỉ chạy OCR cho `media.status = READY`; tạo một idempotent run theo key `classification_run_id` unique.
- Lưu OCR output trong `agent_classification.ocr_text`, model provenance trong `model_id` và các collection/category hiện có được đề xuất với `confidence` bị giới hạn trong `[0,1]`.
- Xem worker output là untrusted. Output có thể chuyển `document_submission.status` từ `PENDING_PROCESSING` sang `PENDING_REVIEW`, nhưng không được set `APPROVED`, đổi `document.visibility_status` thành `PUBLIC` hoặc tạo taxonomy.

#### Step 5.3.2 — FE

- Xây dựng admin review panel cho OCR text, collection/category được đề xuất, confidence, processing failure/retry và file preview qua authorized signed URL.

#### Step 5.3.3 — Integration

- Kết nối Kafka job, retry, idempotent callback và admin queue refresh.
- Acceptance: duplicate worker completion chỉ tạo một classification run, confidence luôn trong giới hạn và không AI result nào trực tiếp publish document.

### Feature 5.4 — Human document review, publication, rejection, and removal

**User stories:** DOC-06, DOC-07, DOC-08, DOC-09, DOC-10.

**Database:** các review field trên `document_submission`; `document.visibility_status`, `tags`, các removal field; `document_collection`, `document_category`; `notification` với các kind `DOCUMENT_REJECTED` và `DOCUMENT_REPORTED`; `audit_log` khi có sensitive access; `outbox_event`.

#### Step 5.4.1 — BE

- Thêm admin queue theo `document_submission.status` và quyết định approve/reject theo transaction.
- Approval yêu cầu final `document_collection` assignment, các row `document_category` optional, `document.tags` đã normalize, `reviewed_by_user_id` và `reviewed_at`; set submission thành `APPROVED` và document thành `PUBLIC`.
- Rejection yêu cầu `rejection_reason`, set `status = REJECTED`, `reviewed_by_user_id`, `reviewed_at`, `purge_at <= reviewed_at + 90 days` và tạo notification `DOCUMENT_REJECTED`.
- Removal set `document.visibility_status = REMOVED`, `removed_by_user_id`, `removed_at` và `removal_reason` bắt buộc; `report_evidence` đã preserve không thay đổi.

#### Step 5.4.2 — FE

- Xây dựng moderation queue có status filter, control để so sánh agent suggestion, chỉnh sửa final collection/category/tag, approve/reject với reason bắt buộc và remove confirmation.
- Update contributor submission view và notification link.

#### Step 5.4.3 — Integration

- Kết nối decision action và realtime notification; verify public visibility chỉ thay đổi sau commit.
- Acceptance: admin—not agent—set final status; item bị reject/remove không xuất hiện trong public API; uploader nhận notification được chỉ định mà không có reporter identity.

### Feature 5.5 — Public search, secure download, and rejected resubmission

**User stories:** DOC-01, DOC-02, DOC-04.

**Database:** public filter trên `document.visibility_status = PUBLIC`, `document_submission.status = APPROVED` mới nhất đã approve, `document.title`, `tags`, `document_collection`, `collection.slug` và `agent_classification.ocr_text` đã approve.

#### Step 5.5.1 — BE

- Thêm PostgreSQL full-text index cho title và OCR text đã approve, cùng các index cho tag và collection join.
- Implement public search theo title, tag, collection và OCR, đồng thời loại trừ document `HIDDEN`/`REMOVED` và submission chưa approve.
- Chỉ cấp download/preview URL short-lived sau khi kiểm tra visibility và permission hiện tại.
- Khi resubmission, giữ nguyên `document.id`, tạo `document_submission.id` append-only mới, reset visibility thành `HIDDEN` và chạy lại scan/OCR/classification nếu changed content yêu cầu.

#### Step 5.5.2 — FE

- Xây dựng các page public library/search/filter/detail/download và contributor resubmission flow hiển thị submission history cùng rejection reason.

#### Step 5.5.3 — Integration

- Verify search result và signed URL bị invalidate sau removal, đồng thời resubmission được tách biệt với lần thử bị reject.
- Acceptance: chỉ document đã approve/public mới có thể search/download, OCR search dùng submission đã approve và resubmission tạo một row `document_submission` mới.

### Checkpoint — Documents

- DOC-01 đến DOC-11 chạy thành công từ upload tới publication/search/resubmission.
- Object storage luôn private; AI không thể publish; các test về rejected retention và bảo toàn report đều chạy thành công.
