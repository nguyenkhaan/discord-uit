## Phase 6 — Public forum, moderation, anonymity, and reactions

### Feature 6.1 — Submit, AI-assist, moderate, edit, and search posts

**User stories:** FORUM-01, FORUM-02, FORUM-03, FORUM-04, FORUM-06, FORUM-09.

**Database:** `forum_post(id, author_user_id, title, content, topics, is_anonymous, status, ai_recommendation, ai_confidence, moderated_by_user_id, moderated_at, moderation_reason, created_at, updated_at, deleted_at)` và `notification.kind = FORUM_POST_APPROVED`.

#### Step 6.1.1 — BE/workers

- Validate JSON `content`, free-form `topics` đã normalize và `ai_confidence` trong `[0,1]`.
- Tạo post với `PENDING_REVIEW`. AI chỉ được set `ai_recommendation`/`ai_confidence`; thao tác approve/reject/remove của admin set `status`, `moderated_by_user_id`, `moderated_at` và `moderation_reason`.
- Khi approval, tạo notification `FORUM_POST_APPROVED` và search index entry. Author edit sẽ reset `status = PENDING_REVIEW` và loại post khỏi public search cho đến khi được re-approve.
- Chỉ search `status = APPROVED` và `deleted_at IS NULL` theo một hoặc nhiều `topics`.

#### Step 6.1.2 — FE

- Xây dựng post editor/topic input, status của post do mình tạo, public feed/detail/search và admin moderation queue, trong đó AI recommendation được gắn nhãn advisory rõ ràng.

#### Step 6.1.3 — Integration

- Kết nối author → AI job → admin decision → public feed/notification → edit/re-review.
- Acceptance: post pending/rejected/removed không bao giờ public, AI không thể quyết định status và việc edit post đã approve sẽ ẩn post cho đến khi reapproval.

### Feature 6.2 — Comments and thread-scoped anonymous aliases

**User stories:** FORUM-05, FORUM-07, FORUM-08.

**Database:** `comment(id, parent_id, forum_post_id, author_user_id, content, is_anonymous, status, created_at, updated_at, deleted_at)`, `anonymous_alias(id, forum_post_id, user_id, display_alias, created_at)` cùng cả hai unique constraint.

#### Step 6.2.1 — BE

- Chỉ cho phép comment/reply khi parent `forum_post.status = APPROVED` và `deleted_at IS NULL`; validate `comment.parent_id` thuộc cùng `forum_post_id`.
- Với anonymous post/comment output, tạo/reuse một `anonymous_alias` trên mỗi `(forum_post_id, user_id)` và expose `display_alias` thay cho profile data của `author_user_id`.
- Nếu user có bất kỳ lần tham gia anonymous post/comment nào trong thread, buộc các comment sau của họ trong thread đó có `is_anonymous = true`.
- Thêm admin identity-reveal endpoint yêu cầu moderation/report purpose; append `audit_log` trước khi trả về identity thật.

#### Step 6.2.2 — FE

- Xây dựng nested comment, reply/edit control, lựa chọn anonymous, alias rendering và admin reveal dialog yêu cầu purpose.
- Đảm bảo public cache không bao giờ nhận hidden author data.

#### Step 6.2.3 — Integration

- Test độ ổn định của alias với same-user/same-thread, khả năng không liên kết giữa different thread, forced continued anonymity và reveal audit.
- Acceptance: public response không thể suy ra `author_user_id`; duplicate alias bị ngăn chặn; mỗi lần reveal đều có một row `audit_log`.

### Feature 6.3 — Forum reactions, comment removal, and cross-module chat sharing

**User stories:** SRV-08, FORUM-10 và phần hỗ trợ FORUM-11.

**Database:** `post_reaction(forum_post_id, user_id, reaction, created_at, updated_at)`, `comment_reaction(comment_id, user_id, reaction, created_at, updated_at)`, `comment.status`, `comment.deleted_at` và `chat_message.linked_content_type`, `linked_content_id`.

#### Step 6.3.1 — BE

- Implement một reaction `LIKE|DISLIKE` trên mỗi user/resource bằng composite key; hỗ trợ change/remove một cách atomic.
- Cho phép author edit khi được phép và admin/report-driven comment removal bằng cách set `comment.status = REMOVED` và `deleted_at`.
- Với `linked_content_type = DOCUMENT|FORUM_POST`, yêu cầu active server membership và validate `linked_content_id` với document có `document.visibility_status = PUBLIC` hoặc post chưa bị delete có `forum_post.status = APPROVED`.
- Chỉ trả về current preview an toàn; source vẫn nằm trong document/forum module và source đã remove sẽ không còn khả dụng ở lần read tiếp theo.

#### Step 6.3.2 — FE

- Thêm post/comment reaction control và count, removed-comment tombstone cùng action “share to server” trên cả document detail page và forum detail page, giới hạn cho active membership.

#### Step 6.3.3 — Integration

- Kết nối reaction update và cả hai sharing path tới `chat_message(linked_content_type, linked_content_id)` bằng `DOCUMENT` hoặc `FORUM_POST`.
- Acceptance: một reaction trên mỗi user/resource, content private/pending không thể được link và shared preview ngừng render source data sau khi document/post bị remove.

### Checkpoint — Forum

- FORUM-01 đến FORUM-10 chạy thành công; FORUM-11 hoàn tất cùng report resolution ở Phase 7.
- Anonymous identity không bao giờ đi vào public payload, log, analytics hoặc FE cache.
