# Agent classification suggestions design

## Intent

Lưu kết quả phân loại do AI đề xuất theo từng lần chạy, nhưng chỉ áp dụng vào
document_tag và document_collection sau khi admin duyệt toàn bộ
DocumentSubmission.

## Chosen approach

Tái sử dụng AgentClassification làm bản ghi suggestion/snapshot theo từng
classification run. Giữ AgentClassificationCollection làm association
collection suggestion, bổ sung association tương ứng AgentClassificationTag.
Không tạo thêm bảng parent document_classification_suggestion vì
document_submission.status đã quản lý trạng thái PENDING_REVIEW, APPROVED,
và REJECTED.

## Model changes

- AgentClassification có các tập association đến collection/tag suggestions.
- AgentClassificationCollection giữ composite key, collection, confidence và
  timestamp; thêm tên foreign key rõ ràng.
- Tạo AgentClassificationTag và AgentClassificationTagId theo cùng pattern.
- Collection và Tag có inverse collections để truy cập các suggestion.

## Database changes

- Thêm bảng agent_classification_tag với khóa kép
  (agent_classification_id, tag_id).
- Bảo đảm confidence của collection/tag suggestion nằm trong [0, 1].
- Không insert taxonomy seed và không ghi vào các bảng phân loại chính thức.
- Chỉ tạo cấu trúc; bước approve sau này sẽ copy các association đã duyệt vào
  document_collection và document_tag trong một transaction.
