## Phase 7 — Reports, scoped moderation, audit, and admin enforcement

### Feature 7.1 — Report submission with immutable evidence

**User stories:** RPT-01, RPT-02, RPT-03.

**Database:** `report(id, reported_by_user_id, target_type, target_id, reason, description, status, assigned_admin_id, resolved_by_admin_id, resolution, created_at, resolved_at)` và `report_evidence(id, report_id, source_type, snapshot, captured_at, purge_at)`.

#### Step 7.1.1 — BE

- Thêm snapshot serializer riêng cho từng report target: `USER_ACCOUNT`, `SERVER`, `CHAT_MESSAGE`, `DOCUMENT`, `FORUM_POST`, `COMMENT` và `CALL_BEHAVIOR`.
- Trong một transaction, insert `report.status = OPEN` và `report_evidence` immutable với `captured_at` cùng `purge_at <= captured_at + 180 days`.
- Với `CALL_BEHAVIOR`, dùng `report.target_id` cho account bị report và chỉ lưu occurrence time cùng behavior type trong `report_evidence.snapshot`; không record media.
- Ngăn update/delete evidence snapshot ở repository/database privilege layer.

#### Step 7.1.2 — FE

- Thêm reusable report dialog cho mọi target được hỗ trợ và form call-behavior riêng với reason/description, người bị report, time và behavior.
- Confirm submission mà không expose nội dung bên trong evidence hoặc chi tiết moderation status.

#### Step 7.1.3 — Integration

- Submit từng `ReportTargetType`, sau đó edit/delete source và xác nhận `report_evidence.snapshot` không thay đổi.
- Acceptance: target không được hỗ trợ/không thể truy cập sẽ thất bại, control chống duplicate/rate-limit hoạt động, call report không chứa recording và evidence có `purge_at` chính xác.

### Feature 7.2 — Admin report case management and sensitive-read audit

**User stories:** RPT-04, ADMIN-03, hoàn tất FORUM-08 và FORUM-11.

**Database:** các field assignment/resolution của report và `audit_log(id, actor_admin_id, action, target_type, target_id, report_id, purpose, occurred_at, metadata, retain_until)`.

#### Step 7.2.1 — BE

- Thêm paginated admin queue theo `report.status`, assignment bằng `assigned_admin_id` và resolution bằng `resolved_by_admin_id`, `resolution`, `resolved_at` cùng `RESOLVED|DISMISSED`.
- Mặc định trả về immutable snapshot. Chỉ cấp source/nearby context với scope hẹp khi cần cho `report.id` đó.
- Trước khi trả về private chat bị report hoặc identity thật của anonymous user, append một `audit_log` immutable gồm admin, action, target, report, `purpose` bắt buộc, `occurred_at`, metadata tối thiểu và `retain_until <= occurred_at + 1 year`.
- Thêm read-only audit-log API cho admin; ngăn mutate row `audit_log`.

#### Step 7.2.2 — FE

- Xây dựng screen report queue/detail/assignment/resolution, evidence viewer, sensitive reveal được gate bằng purpose và audit-log explorer.
- Tách rõ evidence và live source để admin biết data nào là immutable.

#### Step 7.2.3 — Integration

- Kết nối toàn bộ case lifecycle và verify audit được insert trước response chứa sensitive data.
- Acceptance: private history không liên quan không thể truy cập, report status transition hợp lệ và sensitive read luôn để lại immutable audit record.

### Feature 7.3 — Account/server/content enforcement dashboard

**User stories:** ADMIN-01, ADMIN-02, ADMIN-04.

**Database:** `user_account.account_status`, `email_verified_at`; các field server deletion/membership end; các field moderation của document/forum/comment; `audit_log`; `notification` cho direct admin communication được phép.

#### Step 7.3.1 — BE

- Thêm admin account search/detail và ban/unban. Ban sẽ set `account_status = BANNED` và revoke mọi `refresh_session` còn hiệu lực; unban chỉ restore `ACTIVE` khi có `email_verified_at`, nếu không thì restore `UNVERIFIED`.
- Reuse Feature 2.4 cho admin server invite/kick/delete và Features 5/6 cho content action; không tạo bypass endpoint có rule yếu hơn.
- Ghi enforcement action vào `audit_log` cùng target, purpose, `report_id` liên quan khi phù hợp và retention.
- Trả về aggregate admin metric từ bounded query; tuyệt đối không cung cấp quyền browse private chat/call không giới hạn.

#### Step 7.3.2 — FE

- Xây dựng admin navigation và view quản lý account/server/content với status filter, field confirmation/reason và link quay lại report/audit entry liên quan.

#### Step 7.3.3 — Integration

- Ban/unban account có và không có `email_verified_at`; verify session revocation và FE logout. Thực thi server/content action từ một report.
- Acceptance: ADMIN-01 đến ADMIN-04 chạy thành công, action reuse domain rule và không admin screen nào cho phép âm thầm vào call hoặc truy cập private chat không giới hạn.

### Checkpoint — Moderation and administration

- RPT-01 đến RPT-04, FORUM-11 và ADMIN-01 đến ADMIN-04 chạy thành công.
- Các test bao phủ hành vi append-only của evidence/audit, retention date 180 ngày/một năm và read theo purpose scope.
