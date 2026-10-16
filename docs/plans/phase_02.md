## Phase 2 — Notifications, private servers, invitations, and membership

### Feature 2.1 — In-app notification center and admin message

**User stories:** NOTI-01, NOTI-02, NOTI-03.

**Database:** `notification(id, recipient_user_id, actor_user_id, kind, content, related_entity_type, related_entity_id, read_at, deleted_at, created_at)` cùng `outbox_event`.

#### Step 2.1.1 — BE

- Implement paginated notification list, unread count, mark-read và soft-delete theo scope `recipient_user_id`.
- Implement one-way message chỉ dành cho admin bằng `kind = ADMIN_MESSAGE`, dùng admin làm `actor_user_id` và target account làm `recipient_user_id`.
- Tạo notification và `outbox_event` một cách atomic; normal list tuyệt đối không trả về row có `deleted_at`.

#### Step 2.1.2 — FE

- Xây dựng bell/unread badge, notification center, action read/delete và form để admin send message.
- Render `kind`, `content` và safe link từ `related_entity_type`/`related_entity_id`; không suy ra access permission từ link.

#### Step 2.1.3 — Integration

- Kết nối REST initial load và realtime update từ `user:{userId}`; de-duplicate theo `notification.id`.
- Acceptance: chỉ `recipient_user_id` nhìn thấy row, thao tác delete set `deleted_at`, và không thể reply một `ADMIN_MESSAGE` như direct message.

### Feature 2.2 — Create, list, view, and update private servers

**User story:** SRV-01.

**Database:** `server(id, name, group_image_url, created_by_user_id, created_at, updated_at, deleted_by_user_id, deleted_at, deletion_reason)` và `server_membership(id, user_id, server_id, role, joined_at, left_at, ended_reason, ended_by_user_id)`.

#### Step 2.2.1 — BE

- Trong một transaction, tạo `server` và membership của creator với `role = OWNER`.
- Implement server list/detail theo scope member và update `server.name`, `server.group_image_url` theo scope owner; loại trừ các row có `server.deleted_at`.
- Validate server image sử dụng uploaded object đã approve hoặc tuân theo approved URL policy; không tin tưởng URL bất kỳ do browser gửi lên.

#### Step 2.2.2 — FE

- Xây dựng server create form, private server switcher/list, detail shell và owner settings.
- Hiển thị role từ `server_membership.role` đang active; ẩn owner control để cải thiện usability nhưng vẫn xử lý response BE `403`.

#### Step 2.2.3 — Integration

- Kết nối create → list → detail → rename/image update.
- Verify một `server` và một `OWNER` `server_membership` đang active được tạo atomic.
- Acceptance: non-member không thể discover server; member chỉ thấy server mà membership của họ có `left_at = null`.

### Feature 2.3 — Direct invitations and expiring invite links

**User stories:** SRV-02, SRV-03, SRV-04, SRV-05.

**Database:** `server_invite(id, server_id, created_by_user_id, recipient_user_id, token_hash, invite_type, status, expires_at, max_uses, use_count, created_at, accepted_at, declined_at, revoked_at)`, `notification.kind = SERVER_INVITATION`, `server_membership` và `outbox_event`.

#### Step 2.3.1 — BE

- Thêm direct invite và thao tác tạo/revoke link chỉ dành cho owner. Chỉ lưu token hash của invite link.
- Implement accept/decline và link redemption với row locking. Trong một transaction, validate `status`, `expires_at`, recipient/token và capacity; tạo `server_membership(role = MEMBER)`, tăng `use_count` cho link, set timestamp/status khi đã dùng hết và emit event.
- Tạo `SERVER_INVITATION` `notification` cho direct invite với `related_entity_id = server_invite.id`.

#### Step 2.3.2 — FE

- Thêm owner invite dialog, link settings (`expires_at`, `max_uses`), action revoke/copy, action trên direct-invite notification và invite-link
- Hiển thị rõ các state expired, exhausted, revoked, already-member và declined.

#### Step 2.3.3 — Integration

- Kết nối direct accept/decline và concurrent link redemption.
- Verify `server_invite.status`, `accepted_at`/`declined_at`/`revoked_at`, `use_count` và `server_membership` active mới.
- Acceptance: concurrent redemption ở lượt dùng cuối chỉ tạo tối đa số membership được cho phép, và không thể khôi phục token từ `token_hash` đã lưu.

### Feature 2.4 — Membership administration and owner continuity

**User stories:** SRV-06, SRV-07, SRV-09 và các server action trong ADMIN-02.

**Database:** các row active/history trong `server_membership`; `role`, `joined_at`, `left_at`, `ended_reason`, `ended_by_user_id`; các field server deletion.

#### Step 2.4.1 — BE

- Thêm các command owner member-list, promote-to-owner, kick và leave; thêm command admin invite/kick/delete được bảo vệ bởi `user_account.system_role = ADMIN`.
- Khi leave/kick, set `left_at`, `ended_reason = LEFT|KICKED` và `ended_by_user_id` nếu một user khác thực hiện action.
- Nếu owner cuối cùng leave/bị kick, promote `MEMBER` active có `joined_at` mới nhất; serialize transaction này bằng cách lock tập server/membership.
- Khi delete server, set `server.deleted_by_user_id`, `deleted_at`, `deletion_reason` và kết thúc mọi active membership với `ended_reason = SERVER_DELETED`.

#### Step 2.4.2 — FE

- Xây dựng member roster, owner promotion, confirmation cho kick/leave và deleted-server state.
- Thêm admin action theo đúng scope mà không expose private chat history.

#### Step 2.4.3 — Integration

- Test các trường hợp multi-owner, last-owner, no-member, rejoin-history và concurrent leave/promote.
- Acceptance: vẫn enforce một active membership trên mỗi user/server, giữ lại historical row và mọi active server không rỗng đều có owner sau transaction.

### Checkpoint — Servers and notifications

- Các flow SRV-01 đến SRV-07 và SRV-09, NOTI-01 đến NOTI-03 cùng ADMIN-02 liên quan đều chạy thành công.
- Các race condition của direct invitation và link invitation được bao phủ bằng PostgreSQL integration test.
