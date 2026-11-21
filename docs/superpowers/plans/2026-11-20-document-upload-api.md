# Document Upload API Implementation Plan

> For agentic workers: REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

Goal: Xây API multipart cho user upload document, lưu file MinIO và tạo media/document/document_submission mà chưa phân loại.

Architecture: DocumentService validate extension từ property app.agent.classfication.allowed, upload object private qua StorageService, sau đó persist ba entity trong một transaction. Rollback database sẽ xóa object vừa upload.

Tech Stack: Java 17, Spring Boot 4, Spring MVC multipart, Spring Data JPA, MinIO, JUnit 5, Mockito.

Spec: docs/superpowers/specs/2026-11-20-document-upload-api-design.md

## Global Constraints

- Chỉ cho phép pdf, docx, pptx, txt theo property cấu hình.
- Không nhận tag hoặc collection trong request upload.
- Không ghi vào document_tag/document_collection.
- Không chạy upload thật lên MinIO.

## Review Focus

- Extension phải lấy từ original filename, case-insensitive và loại bỏ path traversal.
- Slug thủ công phải được kiểm tra duplicate trước khi upload; slug tự sinh có hậu tố random 10 ký tự.
- File không hợp lệ phải bị từ chối trước khi gọi MinIO hoặc repository.
- DB lỗi sau khi MinIO upload phải cleanup object.
- Media/document/submission phải cùng user và đúng trạng thái ban đầu.

### Task 1: Add failing upload service tests

Files:
- Create: app/backend/src/test/java/com/cloudian/backend/modules/document/DocumentServiceTest.java

Acceptance Criteria:
- Test unsupported extension fails before storage/database.
- Test valid upload persists the three records without tag/collection operations.

### Task 2: Implement document upload module

Files:
- Modify: app/backend/src/main/java/com/cloudian/backend/modules/document/DocumentController.java
- Modify: app/backend/src/main/java/com/cloudian/backend/modules/document/DocumentService.java
- Create: app/backend/src/main/java/com/cloudian/backend/modules/document/dto/UploadDocumentRequest.java
- Create: app/backend/src/main/java/com/cloudian/backend/modules/document/dto/DocumentUploadResponse.java
- Create: app/backend/src/main/java/com/cloudian/backend/repositories/DocumentRepository.java
- Create: app/backend/src/main/java/com/cloudian/backend/repositories/DocumentSubmissionRepository.java

Acceptance Criteria:
- POST /documents consumes multipart/form-data and requires authentication.
- Valid extension uploads to MinIO and creates media/document/document_submission.
- Manual slug is persisted when unique; omitted slug is generated from title with a 10-character suffix.
- Invalid/empty file returns 400 and does not call storage/database.
- DB failure schedules MinIO cleanup.

### Task 3: Verify

Acceptance Criteria:
- DocumentServiceTest and compileJava pass.
- git diff --check passes.
- No real MinIO/Supabase side effect is performed.
