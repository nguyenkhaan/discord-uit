# Document Classification Schema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Đồng bộ backend model và migration với domain document chỉ gồm nhiều collection và nhiều tag, không còn category.

**Architecture:** Giữ association entity `DocumentCollection` với composite key và `DocumentTag` với UUID + unique pair. Chuẩn hóa tag từ cột `document.tags` legacy sang `tag`/`document_tag`, thêm `collection.keywords text[]`, xóa toàn bộ category model/table. Không kết nối hay chạy migration trên Supabase trong plan này.

**Tech Stack:** Java 17, Spring Boot 4, Hibernate/JPA, PostgreSQL, Flyway, Lombok, Gradle, JSON seed runner.

**Spec:** `docs/superpowers/specs/2026-11-20-document-classification-schema-design.md`

## Global Constraints

- Không chạy migration trên Supabase trong thay đổi này.
- Không thay đổi API upload/classification hoặc logic AI Python.
- Giữ `document.slug` vì seed và schema hiện tại vẫn dùng nó.
- Không dùng `CASCADE` khi drop bảng category.
- Không xóa dữ liệu tag cũ; backfill trước khi drop cột `document.tags`.
- Không sửa hoặc seed `app/backend/src/main/java/com/cloudian/backend/data/data.json` và `SeedScript`; dữ liệu seed mới sẽ bổ sung sau khi người dùng cung cấp dữ liệu.
- Giữ các thay đổi backend hiện có của người dùng; chỉ sửa chúng trong phạm vi classification schema.

## Review Focus

- Migration chạy trên database đã có dữ liệu `document.tags`: phải tạo tag/association trước khi drop cột legacy.
- Database không có bảng `tag`/`document_tag` hoặc đã có một phần: migration phải dùng thứ tự và guard phù hợp.
- Entity associations: `DocumentTag`/`DocumentCollection` phải nằm đúng package và mapping `mappedBy` khớp field owner.
- Category dependencies: child tables phải drop trước `category`; còn bất kỳ FK bất ngờ nào phải làm migration fail thay vì âm thầm cascade.
- Seed synchronization is intentionally deferred until replacement data is provided by the user.

### Task 1: Normalize classification entities

**Files:**
- Modify: `app/backend/src/main/java/com/cloudian/backend/models/Document.java`
- Modify: `app/backend/src/main/java/com/cloudian/backend/models/Collection.java`
- Modify: `app/backend/src/main/java/com/cloudian/backend/models/Tag.java`
- Create: `app/backend/src/main/java/com/cloudian/backend/models/DocumentCollection.java`
- Create: `app/backend/src/main/java/com/cloudian/backend/models/DocumentTag.java`
- Delete: `app/backend/src/main/java/com/cloudian/backend/models/ids/DocumentCollection.java`
- Delete: `app/backend/src/main/java/com/cloudian/backend/models/ids/DocumentTag.java`
- Delete: `app/backend/src/main/java/com/cloudian/backend/models/Category.java`
- Delete: `app/backend/src/main/java/com/cloudian/backend/models/DocumentCategory.java`
- Delete: `app/backend/src/main/java/com/cloudian/backend/models/CollectionCategory.java`
- Delete: `app/backend/src/main/java/com/cloudian/backend/models/AgentClassificationCategory.java`
- Delete: `app/backend/src/main/java/com/cloudian/backend/models/ids/DocumentCategoryId.java`
- Delete: `app/backend/src/main/java/com/cloudian/backend/models/ids/CollectionCategoryId.java`
- Delete: `app/backend/src/main/java/com/cloudian/backend/models/ids/AgentClassificationCategoryId.java`

**Interfaces:**
- Consumes: existing `DocumentCollectionId` and `Document`/`Collection`/`Tag` domain fields.
- Produces: compilable JPA entities with `Document.documentCollections`, `Document.documentTags`, `Collection.documentCollections`, and `Tag.documentTags`.

**Acceptance Criteria:**
- `DocumentCollection` is an entity in `models`, uses `@EmbeddedId` + `@MapsId` for `document_id` and `collection_id`.
- `DocumentTag` is an entity in `models`, has `id`, `document`, `tag`, `createdAt`, and unique `(document_id, tag_id)`.
- `Tag.documentTags` uses `@OneToMany(mappedBy = "tag")`, not `@OneToOne`.
- `Document` keeps `slug`, removes legacy `tags text[]`, and exposes both association sets.
- No Java model or ID class references category remain.

- [ ] **Step 1: Add/adjust the entity mapping test or compile target first**

  Use the existing backend test/build path as the regression gate; the first run must expose stale imports or invalid mappings before cleanup is completed.

- [ ] **Step 2: Move association entities into `models` and correct mappings**

  Keep `DocumentCollectionId` in `models.ids`; put entity classes in `models`. Add Lombok accessors/no-args constructors where the surrounding entities require them. Remove legacy `Document.tags` mapping but restore/retain `Document.slug`.

- [ ] **Step 3: Remove category entities and IDs**

  Delete the four category entity classes and their three association ID classes; remove all now-unused imports.

- [ ] **Step 4: Run backend compile/tests**

  Run: `./gradlew test`

  Expected: PASS after seed references are updated in Task 2; if run before Task 2, use compiler output only to identify stale references and continue in dependency order.

### Task 2: Defer seed synchronization until replacement data is provided

**Files:**
- No files changed.

**Interfaces:**
- Consumes: replacement seed data that the user will provide later.
- Produces: an explicit follow-up item; this implementation does not alter the seed runner or JSON.

**Acceptance Criteria:**
- `SeedScript.java`, `SeedScriptTests.java`, and `data.json` remain unchanged by this task.
- No taxonomy/catalogue seed rows are inserted by the migration; only existing legacy document tags are preserved.
- Seed synchronization is revisited after the user supplies the replacement data.

### Task 3: Add the reviewed Flyway migration and schema documentation

**Files:**
- Create: `app/backend/src/main/resources/db/migration/V20261120_01__normalize_document_classification.sql`
- Modify: `docs/DATABASE.txt`

**Interfaces:**
- Consumes: current PostgreSQL `collection`, `document`, `document_collection`, legacy `document.tags`, and category tables.
- Produces: forward-only migration that creates normalized tags, preserves legacy tag values, adds collection keywords, and removes category schema.

**Acceptance Criteria:**
- Migration adds `collection.keywords text[] NOT NULL DEFAULT '{}'::text[]`.
- Migration creates `tag` and `document_tag` with PK/FK/unique constraints if absent.
- Migration backfills distinct legacy tag values and document associations before dropping `document.tags`.
- Migration drops category children before `category` without `CASCADE`.
- Documentation describes tag/collection schema and no longer declares category tables or category refs.

- [ ] **Step 1: Add a static migration regression check**

  Assert via the repository's available checks/inspection that the migration contains the required ordering, no `CASCADE`, the backfill, and the `keywords` default.

- [ ] **Step 2: Write the migration**

  Use a transaction, guarded DDL for additive objects, explicit backfill, then legacy/category cleanup. Do not connect to Supabase.

- [ ] **Step 3: Update `docs/DATABASE.txt`**

  Replace the document `tags string[]` description with `tag`/`document_tag`, add collection keywords, remove category tables/refs, and retain `agent_classification_collection`.

### Task 4: Verify and hand off without applying Supabase changes

**Files:**
- No additional files.

**Acceptance Criteria:**
- Backend tests and build pass.
- Migration is reviewed as text and has not been executed against an external database.
- Final diff contains no frontend edits introduced by this task.

- [ ] **Step 1: Run focused and full backend verification**

  Run: `./gradlew test` and `./gradlew build` from `app/backend`.

- [ ] **Step 2: Check migration/documentation diff**

  Run: `git diff --check`, inspect `git diff --stat`, and `rg` for stale category model/seed references.

- [ ] **Step 3: Report the SQL path and explicit Supabase hold point**

  Hand off the migration file for review; do not run `psql`, Supabase SQL editor, or any external write.
