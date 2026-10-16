## Phase 3 — Realtime server chat

### Feature 3.1 — Message history and idempotent realtime send

**User story:** CHAT-01.

**Database:** `chat_message(id, server_id, sender_user_id, content_text, client_request_id, linked_content_type, linked_content_id, created_at, edited_at, deleted_at, deleted_by_user_id, deletion_reason, purge_at)`, unique `(server_id, sender_user_id, client_request_id)` và `outbox_event`.

#### Step 3.1.1 — BE/realtime

- Implement REST history dùng cursor pagination cho active member, loại trừ row có `deleted_at` khỏi normal content.
- Implement `chat-send` đã authenticated với size/rate limit và `client_request_id` do caller tạo; persist message cùng `outbox_event` một cách atomic và trả về row đã có khi retry.
- Gateway phải authorize `server_membership.left_at = null` hiện tại trước khi join `server:{serverId}` hoặc forward một command.

#### Step 3.1.2 — FE

- Xây dựng chat history với reverse/cursor loading, composer, optimistic pending state theo key `client_request_id`, retry, reconnect indicator và accessible new-message announcement.
- Reconcile optimistic message với `chat_message.id` và `created_at` đã persist.

#### Step 3.1.3 — Integration

- Kết nối history với event `chat-created`; refresh phần history bị bỏ lỡ sau reconnect.
- Acceptance: hai lần retry với cùng `(server_id, sender_user_id, client_request_id)` chỉ tạo một row, non-member không thể read/send và mọi member đều nhận persisted ID.

### Feature 3.2 — Edit, self-delete, and owner removal

**User stories:** CHAT-02, CHAT-03, CHAT-04.

**Database:** `chat_message.content_text`, `edited_at`, `deleted_at`, `deleted_by_user_id`, `deletion_reason`, `purge_at` và `outbox_event`.

#### Step 3.2.1 — BE/realtime

- Chỉ cho phép `sender_user_id` edit message chưa bị delete; update `content_text` và `edited_at`.
- Cho phép sender self-delete; cho phép `OWNER` active remove message của `MEMBER`. Set `deleted_at`, `deleted_by_user_id`, `deletion_reason` bắt buộc từ owner và `purge_at <= deleted_at + 90 days`.
- Emit edit/delete event đã sanitize sau commit. API thông thường không được trả về `content_text` đã delete.

#### Step 3.2.2 — FE

- Thêm action edit và delete cho message thuộc sở hữu của user, owner removal với reason bắt buộc, label “Edited” và deleted-message tombstone.

#### Step 3.2.3 — Integration

- Verify các trường hợp ownership/role thất bại, realtime reconciliation và privacy của deleted content.
- Acceptance: permission của sender và owner khớp rule, `purge_at` được set và report evidence vẫn độc lập với thao tác delete sau đó.

### Feature 3.3 — Message reactions

**Database:** `react_icon(id, icon_image, name, summary, created_at)` và `message_reaction(message_id, reacted_by_user_id, icon_id, created_at)`.

#### Step 3.3.1 — BE

- Seed/manage các row `react_icon` được cho phép và implement add/remove/list reaction bằng primary key `(message_id, reacted_by_user_id, icon_id)`.
- Validate user thực hiện reaction là active member và message đang visible.

#### Step 3.3.2 — FE

- Thêm reaction picker/count với optimistic update và accessible label.

#### Step 3.3.3 — Integration

- Kết nối reaction event và reconcile aggregate count sau reconnect.
- Acceptance: composite key ngăn duplicate reaction và non-member không thể add hoặc remove reaction.

### Checkpoint — Chat

- CHAT-01 đến CHAT-04 chạy thành công trong các test reconnect, retry và authorization.
- Các test về outbox backlog, duplicate event và deleted-content privacy đều chạy thành công.
