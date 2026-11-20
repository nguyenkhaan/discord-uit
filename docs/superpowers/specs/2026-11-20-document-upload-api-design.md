# Document upload API design

## Intent

Cho phép user authenticated upload một tài liệu PDF, DOCX, PPTX hoặc TXT,
nhập metadata cơ bản, lưu file private vào MinIO và tạo dữ liệu
media/document/document_submission.

## Scope

- Multipart endpoint POST /documents.
- Required fields: file và title.
- Optional field: description.
- Optional field: slug ở dạng lowercase-kebab-case; slug trùng trả conflict.
- Nếu không gửi slug, backend sinh từ title và nối hậu tố random 10 ký tự.
- Extension được kiểm tra từ tên file theo app.agent.classfication.allowed,
  không tin Content-Type để quyết định được phép hay không.
- File lưu dưới documents/<uuid>.<extension>.
- Media bắt đầu ở QUARANTINED; submission bắt đầu ở PENDING_PROCESSING.
- Document bắt đầu ở HIDDEN.
- Không nhận hoặc ghi tag/collection ở bước này.

## Consistency

Upload MinIO xảy ra trước khi ghi database. Sau khi upload thành công, đăng ký
transaction synchronization để xóa object nếu transaction database rollback
hoặc flush thất bại. Database tạo media, document và document_submission trong
một transaction.

## Non-goals

- Không gọi AI classification.
- Không approve document.
- Không gắn document_tag/document_collection.
- Không chạy migration hoặc upload thật lên MinIO trong task này.
