# Agent Classification Suggestions Implementation Plan

> For agentic workers: REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

Goal: Bổ sung mô hình và migration cho collection/tag classification suggestions từ AI trước khi admin approve.

Architecture: Tái sử dụng AgentClassification theo từng submission/run. AgentClassificationCollection và AgentClassificationTag chỉ lưu suggestion; DocumentSubmission.status quyết định approve/reject, còn document_collection và document_tag chỉ là dữ liệu chính thức.

Tech Stack: Java 17, Spring Boot 4, Hibernate/JPA, PostgreSQL, Gradle, Lombok.

Spec: docs/superpowers/specs/2026-11-20-agent-classification-suggestions-design.md

## Global Constraints

- Không tạo bảng parent suggestion mới.
- Không seed dữ liệu.
- Không chạy migration lên Supabase.
- Không cho AI ghi trực tiếp vào document_collection hoặc document_tag.
- Confidence phải nằm trong khoảng [0, 1].

## Review Focus

- Composite key của suggestion phải map đúng bằng @EmbeddedId và @MapsId.
- Tên mappedBy ở các inverse association phải trùng field owner.
- Migration phải thêm check constraint cho cả collection và tag suggestion.
- Migration không được insert taxonomy hoặc official document classification.

### Task 1: Add mapping regression test

Files:
- Create: app/backend/src/test/java/com/cloudian/backend/models/AgentClassificationSuggestionsMappingTests.java

Acceptance Criteria:
- Test mô tả entity/table/association bắt buộc và fail khi AgentClassificationTag chưa tồn tại.

### Task 2: Implement suggestion entities

Files:
- Modify: app/backend/src/main/java/com/cloudian/backend/models/AgentClassification.java
- Modify: app/backend/src/main/java/com/cloudian/backend/models/AgentClassificationCollection.java
- Modify: app/backend/src/main/java/com/cloudian/backend/models/Collection.java
- Modify: app/backend/src/main/java/com/cloudian/backend/models/Tag.java
- Create: app/backend/src/main/java/com/cloudian/backend/models/AgentClassificationTag.java
- Create: app/backend/src/main/java/com/cloudian/backend/models/ids/AgentClassificationTagId.java

Acceptance Criteria:
- AgentClassificationTag dùng composite key (agent_classification_id, tag_id).
- Collection và tag suggestions có confidence, createdAt và FK mapping.
- AgentClassification, Collection, Tag có inverse associations đúng mappedBy.

### Task 3: Add migration and schema documentation

Files:
- Create: app/backend/src/main/resources/db/migration/V20261120_02__add_agent_classification_tag_suggestions.sql
- Modify: docs/DATABASE.txt

Acceptance Criteria:
- Tạo agent_classification_tag.
- Thêm/đảm bảo check constraint confidence [0, 1] cho hai bảng suggestion.
- Không có seed insert.

### Task 4: Verify

Acceptance Criteria:
- Mapping test và ./gradlew compileJava pass.
- git diff --check pass.
- Migration chưa được chạy lên Supabase.
