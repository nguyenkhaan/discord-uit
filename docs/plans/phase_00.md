## Phase 0 — Engineering foundation and reliable delivery

### Feature 0.1 — Runnable application shell and shared contracts

**Outcome:** BE, FE, PostgreSQL, Kafka và test tooling có thể chạy ổn định trước khi nhóm bắt đầu xử lý domain.

#### Step 0.1.1 — BE foundation

- Thêm Flyway, PostgreSQL Testcontainers, validation và cấu hình static-analysis cần thiết vào `app/backend/build.gradle`.
- Tổ chức BE theo feature trong `com.cloudian.backend.modules`; sử dụng ranh giới controller → application service → repository và các request/response record immutable.
- Chuyển JWT keys và cấu hình external service ra khỏi `JwtUtil` sang cấu hình dựa trên environment đã được validate. Trong Phase 1, thay implementation `CustomUserDetailsService` đang hard-code bằng boundary dựa trên repository.
- Ổn định shared error contract với `code`, `message`, `status`, `timestamp`, `path` và các lỗi field-validation, đồng thời giữ nguyên hành vi exception handler hiện có.
- Thêm local profile PostgreSQL/Kafka, health/readiness checks và configuration validation.
- Verify: `cd app/backend && ./gradlew test` chạy thành công.

#### Step 0.1.2 — FE foundation

- Thay Vite demo bằng application shell trong `app/frontend/src`, gồm layout cho public, authenticated user và admin.
- Thêm routing, typed HTTP client, xử lý server-state/query, một session store duy nhất, form validation, error boundary, khu vực toast/notification và responsive navigation.
- Thống nhất dùng một package manager; chọn npm vì đã có `package-lock.json`, đồng thời xóa lockfile cạnh tranh trong lần thay đổi implementation này.
- Thêm script cho Vitest/React Testing Library và Playwright; giữ nguyên các bước kiểm tra TypeScript strict và ESLint.
- Verify: `cd app/frontend && npm ci && npm run lint && npm run build && npm test -- --run` chạy thành công.

#### Step 0.1.3 — Integration

- Cấu hình FE API base URL và CORS cho môi trường local/staging; gọi `/api/health` từ status screen.
- Generate hoặc validate FE API types từ `/api/docs/openapi` trong CI.
- Thêm một smoke test để khởi động stack và kiểm tra luồng FE → `/api/health` → BE.
- Acceptance: stack khởi động được bằng các command đã ghi trong tài liệu, hiển thị trạng thái healthy và render shared error UI khi API không khả dụng.

### Feature 0.2 — Transactional outbox and realtime transport

**Outcome:** các feature về sau có thể gửi event mà không broadcast state chưa được commit.

#### Step 0.2.1 — BE/realtime foundation

- Thêm outbox publisher để claim các row `PENDING`, publish qua Kafka, đặt `status = PUBLISHED` và `published_at`, rồi retry bằng cách tăng `attempt_count`; chuyển các item đã hết số lần thử sang `FAILED` và phát operational alert.
- Thêm Socket.IO gateway tại `app/realtime-gateway` làm authorized realtime adapter như mô tả trong architecture. Gateway chỉ được chấp nhận room name do server tạo, ví dụ `user:{userId}` và `server:{serverId}`.
- Kiểm thử atomic rollback: domain change và `outbox_event` phải cùng commit hoặc cùng roll back.

#### Step 0.2.2 — FE realtime client

- Thêm một Socket.IO client đã authenticated, có reconnect/backoff, connection status, event de-duplication và clean session teardown.
- Route event của user room vào query cache/store; không lặp lại business rule của feature trong socket layer.
- Thêm trạng thái reconnect dễ nhận biết và retry action đáp ứng accessibility.

#### Step 0.2.3 — Integration

- Publish một test event không chứa dữ liệu nhạy cảm qua `outbox_event`, Kafka, gateway và FE client đã authenticated.
- Verify việc delivery trùng lặp không gây lỗi và reconnect sẽ trigger REST refresh.
- Acceptance: chỉ user được chỉ định nhận event, unauthorized room subscription thất bại và không có event nào xuất hiện sau một transaction đã roll back.

### Checkpoint — Foundation

- `./gradlew test`, FE lint/build/tests, gateway tests và stack smoke test đều chạy thành công.
- Không còn credential hard-code trong application code được track.
- OpenAPI và shared error contract được version hóa và FE sử dụng.
