# Document AI Classification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng pipeline OCR và agent đề xuất collection/tag cho document thông qua Kafka, trong đó backend giữ quyền quyết định trạng thái và taxonomy chính thức.

**Architecture:** Backend xác thực upload, tạo classification run và ghi outbox event trong cùng transaction. Kafka chuyển job sang Python worker trong `app/ai`; worker tự quyết định có cần OCR hay không, sau đó publish kết quả chưa tin cậy về Kafka. Backend validate kết quả, lưu `agent_classification` và chuyển submission sang `PENDING_REVIEW`; AI không được approve, public hoặc ghi taxonomy chính thức.

**Tech Stack:** Spring Boot, Spring Kafka, PostgreSQL/Flyway, MinIO signed URL, Python 3.12+, FastAPI, SQLAlchemy/asyncpg, `uv`, Kafka, PyMuPDF/pdf extraction, DOCX/PPTX text extraction, OCR provider, Pydantic.

**Spec:** `docs/plans/phase_05.md` — Feature 5.3, Steps 5.3.1–5.3.3.

## Global Constraints

- Chỉ xử lý OCR/classification khi `media.status = READY`.
- `document_submission.status` chỉ chuyển từ `PENDING_PROCESSING` sang `PENDING_REVIEW` sau khi backend nhận kết quả hợp lệ.
- `classification_run_id` phải unique và mọi completion phải idempotent.
- Confidence phải là số hữu hạn trong `[0,1]`; backend không âm thầm tin tưởng output từ AI.
- Collection/tag đề xuất phải tham chiếu taxonomy hiện có; AI không được tạo hoặc ghi taxonomy chính thức.
- AI không được set `APPROVED`, `PUBLIC` hoặc cấp quyền download public.
- File vẫn private; AI chỉ nhận signed GET URL ngắn hạn, không nhận permanent `object_key` hoặc MinIO credentials.
- Không ghi OCR text hoặc signed URL đầy đủ vào log; không render OCR như HTML.
- Job lỗi phải có retry có giới hạn và dead-letter path; duplicate message không được tạo classification run thứ hai.
- Các bảng `agent_classification`, `agent_classification_collection` và `agent_classification_tag` đã tồn tại; chỉ mở rộng migration khi cần tracking run/retry.

## Review Focus

- Upload completion xảy ra nhưng backend crash trước khi publish Kafka: outbox phải giữ job để publish lại.
- Kafka gửi duplicate hoặc completion đến sai thứ tự: backend phải kiểm tra run/submission/media và xử lý idempotent.
- AI trả slug không tồn tại, confidence ngoài `[0,1]`, JSON sai schema hoặc OCR quá dài: backend phải reject kết quả và ghi failure.
- PDF có text layer, PDF scan ảnh, PDF nhiều trang hoặc file không được hỗ trợ: worker phải chọn extraction/OCR đúng và áp dụng giới hạn tài nguyên.
- Worker/API bị gọi trực tiếp từ client hoặc signed URL hết hạn: request phải bị từ chối, không lộ storage credential.

---

### Task 1: Classification run state and Kafka contracts

**Files:**

- Create: `app/backend/src/main/resources/db/migration/V20261122_01__create_classification_run.sql`
- Create: `app/backend/src/main/java/com/cloudian/backend/commons/enums/ClassificationRunStatus.java`
- Create: `app/backend/src/main/java/com/cloudian/backend/models/ClassificationRun.java`
- Create: `app/backend/src/main/java/com/cloudian/backend/repositories/ClassificationRunRepository.java`
- Create: `app/backend/src/main/java/com/cloudian/backend/modules/document/messaging/ClassificationRequestedEvent.java`
- Create: `app/backend/src/main/java/com/cloudian/backend/modules/document/messaging/ClassificationCompletedEvent.java`
- Create: `app/backend/src/main/java/com/cloudian/backend/modules/document/messaging/ClassificationFailedEvent.java`
- Modify: `app/backend/src/main/java/com/cloudian/backend/models/AgentClassification.java`
- Test: `app/backend/src/test/java/com/cloudian/backend/modules/document/ClassificationRunRepositoryTests.java`

**Interfaces:**

- Consumes: `DocumentSubmission`, `Media`, existing `OutboxEvent` and existing agent suggestion entities.
- Produces: `ClassificationRunStatus` values `QUEUED`, `RUNNING`, `SUCCEEDED`, `FAILED`, `DEAD_LETTER`; a unique `classificationRunId`; versioned event payloads for later Kafka producer/consumer tasks.

**Acceptance Criteria:**

- A run is uniquely identified by `classification_run_id` and references one submission and one media row.
- Run status, attempt count, failure code/message, model id, OCR-needed flag and timestamps are persisted.
- A run for a non-`READY` media row cannot be queued.
- Existing suggestion tables remain append-only and are not confused with official document taxonomy.

- [ ] **Step 1: Write failing repository/entity tests** for unique run id, submission/media references, and status transitions.
- [ ] **Step 2: Run the focused backend tests** and confirm the new schema/entity is missing.
- [ ] **Step 3: Add the Flyway migration and JPA model/repository** with foreign keys, indexes, status enum, and unique constraint.
- [ ] **Step 4: Define versioned event DTOs** with `eventId`, `classificationRunId`, `documentId`, `submissionId`, `mediaId`, file metadata, signed URL metadata, taxonomy snapshot/version, attempt and timestamp.
- [ ] **Step 5: Run focused repository tests and migration validation**.

Run: `./gradlew test --tests '*ClassificationRunRepositoryTests'`

Expected: PASS with the unique/idempotent run constraints covered.

---

### Task 2: Backend enqueue and reliable Kafka publishing

**Files:**

- Create: `app/backend/src/main/java/com/cloudian/backend/modules/document/messaging/ClassificationEventWriter.java`
- Create: `app/backend/src/main/java/com/cloudian/backend/modules/document/messaging/ClassificationOutboxPublisher.java`
- Create: `app/backend/src/main/java/com/cloudian/backend/configs/ClassificationKafkaConfig.java`
- Modify: `app/backend/src/main/java/com/cloudian/backend/modules/document/DocumentService.java`
- Modify: `app/backend/src/main/java/com/cloudian/backend/repositories/OutboxEventRepository.java`
- Modify: `app/backend/src/main/resources/application.properties`
- Modify: `docker-compose.yaml`
- Test: `app/backend/src/test/java/com/cloudian/backend/modules/document/ClassificationEventWriterTests.java`
- Test: `app/backend/src/test/java/com/cloudian/backend/modules/document/DocumentServiceTest.java`

**Interfaces:**

- Consumes: Task 1 `ClassificationRequestedEvent`, `ClassificationRunRepository`, existing upload completion flow and `OutboxEvent` pattern.
- Produces: topics `document.classification.requested.v1`, `document.classification.completed.v1`, `document.classification.failed.v1`, and `document.classification.dlq.v1`; a queued run created after successful upload completion.

**Acceptance Criteria:**

- `completeUpload` only enqueues when the media is `READY` and submission is `PENDING_PROCESSING`.
- Database state and the requested outbox event are committed atomically.
- The HTTP response returns immediately with `PENDING_PROCESSING`; it does not wait for AI/OCR.
- Publishing is retried with bounded attempts; exhausted events are marked dead-lettered and remain inspectable.
- Local compose creates all classification topics without replacing the existing notification topic.

- [ ] **Step 1: Add failing tests** for READY gating, immediate response, atomic outbox creation, duplicate completion, and publish retry.
- [ ] **Step 2: Run focused tests and confirm the enqueue behavior is absent.**
- [ ] **Step 3: Implement the event writer** using an opaque signed GET URL and taxonomy snapshot/version; never put MinIO credentials or permanent object keys in the event.
- [ ] **Step 4: Implement the outbox publisher and Kafka producer settings** with idempotent producer configuration and explicit topic names.
- [ ] **Step 5: Add local Kafka topic initialization and run backend tests.**

Run: `./gradlew test --tests '*ClassificationEventWriterTests' --tests '*DocumentServiceTest'`

Expected: PASS; duplicate upload completion does not create a second active run.

---

### Task 3: Python AI service boundary and worker runtime

**Files:**

- Modify: `app/ai/pyproject.toml`
- Modify: `app/ai/.env.example`
- Modify: `app/ai/README.md`
- Modify: `app/ai/main.py`
- Modify: `app/ai/src/config/setting.py`
- Create: `app/ai/src/contract/classification_event.py`
- Create: `app/ai/src/worker/kafka_consumer.py`
- Create: `app/ai/src/worker/kafka_producer.py`
- Create: `app/ai/src/worker/job_store.py`
- Create: `app/ai/src/http/health.py`
- Test: `app/ai/tests/test_event_contracts.py`
- Test: `app/ai/tests/test_worker_idempotency.py`

**Interfaces:**

- Consumes: Task 2 `document.classification.requested.v1` event schema.
- Produces: validated `ClassificationCompletedEvent` or `ClassificationFailedEvent`; internal health/readiness endpoint bound only to the private service network.

**Acceptance Criteria:**

- AI has no public client route for starting classification.
- Configuration comes from environment variables for Kafka bootstrap, group id, topic names, service identity, OCR/LLM settings and timeouts.
- Event payloads are validated before processing and output payloads are schema-validated before publishing.
- A duplicate `classificationRunId` is acknowledged without running OCR/classification twice.
- OCR text, signed URLs and document contents are never written to ordinary logs.

- [x] **Step 1: Write failing Pydantic contract and duplicate-job tests.**
- [x] **Step 2: Run `uv run pytest` and confirm the worker contract is missing.**
- [x] **Step 3: Add settings, event models, Kafka consumer/producer and a persistent idempotency store** keyed by `classificationRunId`.
- [x] **Step 4: Add health/readiness checks** without exposing a classification endpoint to the browser/client network.
- [x] **Step 5: Run the AI unit tests and validate the service from a clean `.env.example`.**

Run: `uv run pytest app/ai/tests -q`

Expected: PASS with malformed, duplicate and oversized event cases covered.

---

### Task 4: Content extraction and conditional OCR pipeline

**Files:**

- Create: `app/ai/src/content/file_probe.py`
- Create: `app/ai/src/content/text_extractors.py`
- Create: `app/ai/src/content/pdf_ocr.py`
- Create: `app/ai/src/content/ocr_policy.py`
- Modify: `app/ai/src/agentic/ocr_ai.py`
- Modify: `app/ai/src/agentic/workflow.py`
- Test: `app/ai/tests/test_file_probe.py`
- Test: `app/ai/tests/test_ocr_policy.py`
- Test: `app/ai/tests/test_text_extractors.py`

**Interfaces:**

- Consumes: Task 3 validated job and signed GET URL; file metadata and configured resource limits.
- Produces: `ExtractedContent(text, source, needs_ocr, page_count)` plus structured failure codes for unsupported, corrupt, oversized or timed-out files.

**Acceptance Criteria:**

- DOCX/PPTX/TXT use direct extraction where possible.
- Text-based PDF avoids OCR when the extracted text passes the configured quality threshold.
- Image-only/scanned PDF triggers OCR only when the policy says it is necessary.
- Page count, file size, render dimensions, OCR timeout and total text length are bounded.
- OCR output is treated as untrusted plain text and is not rendered as HTML.

- [x] **Step 1: Add fixture-based failing tests** for text PDF, image-only PDF, DOCX, PPTX, TXT, corrupt input and resource limits.
- [x] **Step 2: Run the tests and confirm the extractor/policy behavior is absent.**
- [x] **Step 3: Implement MIME/signature probing and direct extractors.**
- [x] **Step 4: Implement PDF text-quality scoring and the conditional OCR path.**
- [x] **Step 5: Run all AI content tests, including timeout and cleanup assertions.**

Run: `uv run pytest app/ai/tests/test_file_probe.py app/ai/tests/test_ocr_policy.py app/ai/tests/test_text_extractors.py -q`

Expected: PASS; OCR is skipped for readable text PDFs and used for image-only PDFs.

---

### Task 5: Agent recommendation and backend result consumer

**Files:**

- Modify: `app/ai/src/agentic/workflow.py`
- Modify: `app/ai/src/agentic/llm.py`
- Modify: `app/ai/src/agentic/tools.py`
- Create: `app/ai/src/agentic/output_schema.py`
- Create: `app/backend/src/main/java/com/cloudian/backend/modules/document/messaging/ClassificationResultConsumer.java`
- Create: `app/backend/src/main/java/com/cloudian/backend/modules/document/ClassificationResultService.java`
- Create: `app/backend/src/main/java/com/cloudian/backend/modules/document/dto/ClassificationSuggestionResponse.java`
- Modify: `app/backend/src/main/java/com/cloudian/backend/repositories/AgentClassificationCollectionRepository.java`
- Modify: `app/backend/src/main/java/com/cloudian/backend/repositories/AgentClassificationTagRepository.java`
- Modify: `app/backend/src/main/java/com/cloudian/backend/repositories/DocumentSubmissionRepository.java`
- Test: `app/ai/tests/test_classification_output.py`
- Test: `app/backend/src/test/java/com/cloudian/backend/modules/document/ClassificationResultServiceTests.java`

**Interfaces:**

- Consumes: Task 4 `ExtractedContent`; Task 2 completed/failed event topics; existing `Collection` and `Tag` repositories.
- Produces: one successful `AgentClassification` per run, suggestion links with confidence, and a valid transition to `PENDING_REVIEW`.

**Acceptance Criteria:**

- AI output uses structured JSON with `modelId`, `classificationRunId`, OCR text and bounded collection/tag suggestions.
- Backend resolves slugs against current taxonomy and rejects unknown or malformed suggestions without mutating official `document_collection`/`document_tag`.
- Completion is idempotent and validates matching run, submission, media and current processing status.
- Success persists agent output and changes submission to `PENDING_REVIEW`.
- Failure updates run status, leaves the submission non-public, and allows bounded retry.
- No result path can set `APPROVED`, `PUBLIC` or final taxonomy.

- [ ] **Step 1: Add failing worker output tests** for valid output, unknown slug, confidence outside `[0,1]`, duplicate suggestion and oversized OCR text.
- [ ] **Step 2: Add failing backend consumer tests** for success, duplicate completion, stale submission, media mismatch, failure and retry exhaustion.
- [ ] **Step 3: Implement AI structured output validation and model provenance.**
- [ ] **Step 4: Implement the backend transactional result consumer** with idempotency and allowlist validation.
- [ ] **Step 5: Run AI and backend focused tests.**

Run: `uv run pytest app/ai/tests/test_classification_output.py -q`
Run: `./gradlew test --tests '*ClassificationResultServiceTests'`

Expected: PASS; successful AI output only reaches `PENDING_REVIEW`, never `PUBLIC`.

---

### Task 6: Admin review panel, retry, and queue refresh

**Files:**

- Modify: `app/backend/src/main/java/com/cloudian/backend/modules/document/AdminDocumentController.java`
- Create: `app/backend/src/main/java/com/cloudian/backend/modules/document/dto/ClassificationRetryResponse.java`
- Modify: `app/frontend/src/features/documents/document.type.ts`
- Modify: `app/frontend/src/features/documents/document.service.ts`
- Modify: `app/frontend/src/features/documents/document.hooks.ts`
- Modify: `app/frontend/src/features/admin/pages/AdminDocumentReviewPage.tsx`
- Create: `app/frontend/src/features/admin/components/AdminDocumentClassificationPanel.tsx`
- Test: `app/frontend/tests/features/admin/admin-document-classification.utils.test.ts`

**Interfaces:**

- Consumes: Task 5 backend result state and signed preview URL; existing taxonomy editor and document review controls.
- Produces: admin-only OCR/suggestion panel, processing failure/retry action, confidence display and queue refresh.

**Acceptance Criteria:**

- Admin can see OCR text, suggested collections/tags, confidence, model id and processing status.
- Admin can retry a failed run without creating duplicate active runs.
- Existing taxonomy editor remains the only path that changes final collection/tag assignments.
- Preview uses an authorized short-lived URL and does not expose `object_key`.
- Loading uses local skeletons and errors provide retry feedback; AI result never hides status decision controls.

- [ ] **Step 1: Add frontend mapping and state tests** for queued/running/success/failure/dead-letter states.
- [ ] **Step 2: Add admin-only retry API contract and query invalidation.**
- [ ] **Step 3: Implement the local classification panel** beside the existing preview/taxonomy editor.
- [ ] **Step 4: Add skeleton, error, retry and queue-refresh behavior.**
- [ ] **Step 5: Run frontend tests, type-check and build.**

Run: `bun test`
Run: `bun run type-check`
Run: `bun run build`

Expected: PASS; panel is visible only on the admin review page and final taxonomy/status controls remain functional.

---

### Task 7: End-to-end Kafka integration and security verification

**Files:**

- Modify: `docker-compose.yaml`
- Modify: `app/backend/src/main/resources/application.properties`
- Modify: `app/ai/.env.example`
- Modify: `app/ai/README.md`
- Create: `app/backend/src/test/java/com/cloudian/backend/modules/document/ClassificationKafkaIntegrationTests.java`
- Create: `app/ai/tests/test_kafka_integration.py`
- Modify: `docs/plans/phase_05.md` or add a task-specific runbook only if the phase status needs updating.

**Interfaces:**

- Consumes: all previous task contracts and local Kafka/MinIO/Postgres services.
- Produces: a reproducible local flow from upload completion to admin review and a documented production security checklist.

**Acceptance Criteria:**

- Upload completion returns immediately while the AI job is processed asynchronously.
- A successful end-to-end run creates exactly one classification result and moves the submission to `PENDING_REVIEW`.
- Duplicate request/completion, worker timeout, malformed output, signed URL expiry and Kafka retry are covered.
- Public users cannot call the AI service, consume Kafka, access MinIO objects, or approve/publish documents.
- AI failure leaves the document private and visible to admin for retry/diagnosis.

- [ ] **Step 1: Start local Kafka/MinIO/backend/AI services and verify health/readiness.**
- [ ] **Step 2: Run the end-to-end upload → Kafka request → AI result → backend consumer scenario.**
- [ ] **Step 3: Run duplicate, failure and security scenarios.**
- [ ] **Step 4: Run the full relevant test suites and record known unrelated failures separately.**
- [ ] **Step 5: Update the phase checkpoint and implementation notes.**

Run: `docker compose up -d kafka kafka-init minio`
Run: `./gradlew test`
Run: `uv run pytest app/ai/tests -q`
Run: `bun test && bun run type-check && bun run build`

Expected: the complete pipeline is asynchronous, private-by-default, idempotent and admin-controlled.

## Dependency Order

```text
Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6 → Task 7
```

Task 1 and Task 2 define the event/schema boundary. Task 3 can be scaffolded after the event contract exists, but Task 4 depends on the worker runtime. Task 5 is the first complete backend/AI vertical slice. Task 6 exposes it to admins. Task 7 verifies the whole system and security boundary.

## Self-Review Checklist

- Spec coverage: OCR gating, model provenance, confidence, untrusted output, Kafka retry/idempotency, admin panel, failure/retry and no-AI-publish are covered by Tasks 1–7.
- Existing classification entities are reused; only run tracking is added because the phase acceptance requires failure/retry visibility.
- Official taxonomy and publication remain owned by the existing human review flow.
- Upload response remains synchronous and fast; all agent work is asynchronous.
- No task requires the AI service to expose a public classification API.
