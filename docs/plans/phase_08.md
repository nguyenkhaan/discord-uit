## Phase 8 — Retention, resilience, accessibility, and release

### Feature 8.1 — Retention and purge automation

**Database:** `chat_message.purge_at`, `document_submission.purge_at` đã reject, `report_evidence.purge_at`, `audit_log.retain_until`, object-storage key được tham chiếu bởi `media.object_key` và notification được giữ lại cho đến khi có `notification.deleted_at` hoặc account deletion.

#### Step 8.1.1 — BE/workers

- Thêm idempotent scheduled job để purge vĩnh viễn soft-deleted chat content đủ điều kiện sau tối đa 90 ngày, artifact của rejected submission sau tối đa 90 ngày, report evidence sau tối đa 180 ngày và audit log sau tối đa một năm.
- Chỉ delete private storage object một cách an toàn khi không document/evidence nào cần giữ lại object đó; đánh dấu `media.status = DELETED` sau khi xác nhận object deletion.
- Không auto-expire notification; loại row có `notification.deleted_at` khỏi user view.

#### Step 8.1.2 — FE

- Thêm nội dung giải thích rõ retention/deletion trong destructive action và admin status screen; đảm bảo expired content hiển thị neutral unavailable state.

#### Step 8.1.3 — Integration

- Chạy job với time-controlled fixture và verify kết quả ở database/object storage cùng repeat safety.
- Acceptance: job tuân thủ mọi `purge_at`/`retain_until`, giữ lại evidence chưa đến hạn và tạo auditable metric mà không log content đã purge.

### Feature 8.2 — Security, accessibility, and failure recovery

#### Step 8.2.1 — BE/realtime

- Áp dụng rate limit cho login, password reset, invite redemption, upload, chat và report creation; validate upload signature; enforce TLS/security header và CORS nghiêm ngặt.
- Thêm retry/dead-letter handling cho worker, outbox reconciliation, webhook signature/replay protection, structured logging, metric và alert.
- Chạy dependency, static-analysis, authorization matrix và secret scan. Rotate prototype JWT key và production credential trước release.

#### Step 8.2.2 — FE

- Hoàn thiện keyboard navigation, focus management, label, contrast, responsive layout, reduced-motion support và screen-reader announcement cho realtime change.
- Thêm offline/retry/error state nhất quán và ngăn sensitive data còn lại sau logout/account ban.

#### Step 8.2.3 — Integration

- Chạy automated accessibility check, security regression test, scenario connection-loss/queue-retry và role-based E2E suite.
- Acceptance: không còn security finding mức critical/high, core flow đạt kiểm tra WCAG 2.2 AA và transient failure có thể recover mà không tạo duplicate committed state.

### Feature 8.3 — Scale validation, deployment, and operational handoff

#### Step 8.3.1 — BE/infrastructure

- Package Spring Boot, Socket.IO gateway, worker, PostgreSQL, Kafka, Redis, object storage và cấu hình LiveKit cho staging/production.
- Thêm production index dựa trên query đã đo, connection-pool limit, database backup/restore, object lifecycle safeguard và procedure migration rollback/forward-fix.
- Chỉ load-test target đã ghi trong tài liệu: khoảng 1.000 account, 500 concurrent user, 200 concurrent call participant trên toàn hệ thống và 30 participant trên mỗi call.

#### Step 8.3.2 — FE

- Tạo environment-specific build, cache immutable asset, validate bundle size, cấu hình runtime API/realtime/LiveKit endpoint và publish tài liệu vận hành cho user/admin.

#### Step 8.3.3 — Integration

- Chạy full staging suite: personal auth, UIT SSO, server invitation, chat/reconnect, call, document pipeline, forum moderation/anonymity, reporting, notification, admin action và retention.
- Thực hiện backup/restore và rollback drill; ghi lại dashboard, alert, runbook và ownership.
- Acceptance: mọi definition-of-done gate trên toàn dự án đều chạy thành công ở target scale và release checklist được sign off.

### Final checkpoint

- Mọi user story AUTH-01–08, SRV-01–09, CHAT-01–04, CALL-01–06, DOC-01–11, FORUM-01–11, RPT-01–04, NOTI-01–03 và ADMIN-01–04 đều trace được tới integrated test chạy thành công.
- BE: `cd app/backend && ./gradlew check` chạy thành công.
- FE: `cd app/frontend && npm ci && npm run lint && npm run build && npm test -- --run && npm run test:e2e` chạy thành công.
- Các check cho realtime gateway/worker cùng full-stack staging smoke/load test đều chạy thành công.
- Không có feature out-of-scope nào được đưa vào.
