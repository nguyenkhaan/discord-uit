# Document classification schema design

## Intent

Đồng bộ model backend và schema seed với pipeline AI hiện tại. Pipeline chỉ đề xuất `tags` và `collections`; một document có thể thuộc nhiều collection và nhiều tag, không có category.

## Goals

- Giữ `DocumentCollection` làm entity liên kết nhiều-nhiều với khóa kép `(document_id, collection_id)`.
- Dùng `Tag` và `DocumentTag` cho tag được quản lý/đề xuất, với unique `(document_id, tag_id)`.
- Lưu `Collection.keywords` bằng PostgreSQL `text[]` để khớp catalogue AI.
- Xóa model và database tables cho `category`, `document_category`, `collection_category`, `agent_classification_category`.
- Migration backfill dữ liệu cũ từ `document.tags text[]` sang `tag` và `document_tag` trước khi xóa cột legacy.
- Cập nhật tài liệu schema để không còn tham chiếu category; seed script/data được giữ nguyên cho đến khi có dữ liệu thay thế.

## Non-goals and constraints

- Không chạy migration trên Supabase trong thay đổi này.
- Không sửa hoặc seed `SeedScript`/`data.json`; dữ liệu taxonomy mới sẽ bổ sung sau. Migration chỉ backfill các tag legacy đang có để tránh mất dữ liệu.
- Không thay đổi API upload/classification hoặc logic AI Python.
- Giữ `document.slug` vì seed và schema hiện tại vẫn dùng nó.
- Không dùng `CASCADE` khi drop bảng category; migration phải fail nếu còn dependency ngoài các bảng đã xác định.
- Không xóa dữ liệu tag cũ; backfill trước khi drop cột `document.tags`.

## Approach

- Phương án đã chọn: cleanup category hoàn toàn và chuẩn hóa tag thành entity + join table. Đây là phương án khớp với catalogue AI và yêu cầu document nhiều tag/collection.
- Không giữ category legacy vì trái với yêu cầu domain mới.
- Không thay association bằng `@ManyToMany` trực tiếp vì cần giữ entity liên kết, khóa/unique constraint và metadata `created_at`.

## Model decisions

- `DocumentCollection` và `DocumentTag` nằm trong package `com.cloudian.backend.models`; chỉ các lớp khóa nhúng nằm trong `models.ids`.
- `DocumentCollection` dùng `@EmbeddedId`/`@MapsId`.
- `DocumentTag` giữ UUID riêng và unique constraint trên cặp document/tag để tương thích entity hiện người dùng đã viết.
- `Tag.documentTags` dùng `@OneToMany`, không phải `@OneToOne`.

## Migration decisions

- Thêm `collection.keywords text[] NOT NULL DEFAULT '{}'`.
- Tạo `tag` và `document_tag` nếu chưa có.
- Backfill tag slug/name từ `document.tags`, tạo association không trùng, rồi drop `document.tags`.
- Drop theo thứ tự `agent_classification_category`, `document_category`, `collection_category`, cuối cùng `category`.
- Tạo/giữ unique index cho `document_collection(document_id, collection_id)`.
