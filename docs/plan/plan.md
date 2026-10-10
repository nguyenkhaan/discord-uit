# Feature-Driven Implementation Plan

Kế hoạch này được viết cho một nhóm phát triển sinh viên. Nhóm sẽ triển khai dự án theo từng phase nhỏ, có thể kiểm thử được; mỗi feature được chia thành phần việc BE, FE và Integration. Tại mỗi checkpoint, nhóm cần kiểm tra các acceptance criteria trước khi chuyển sang phần tiếp theo.

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

## Phase 1 — Identity, accounts, and sessions

### Feature 1.1 — Personal registration, email verification, and profile

**User stories:** AUTH-03, AUTH-04, AUTH-08.

**Database:** `user_account(id, email, password_hash, account_type, account_status, email_verified_at, uit_subject, full_name, system_role, created_at, updated_at)` và `account_token(id, user_id, token_hash, purpose, expires_at, consumed_at, created_at)`.

#### Step 1.1.1 — BE

- Khai báo toàn bộ database model của dự án trong BE theo database design đã hoàn tất, bao gồm relationship, foreign key, check/unique constraint và index; tạo một full-schema Flyway migration để migrate toàn bộ database trong Step này.
- Implement personal registration: từ chối `@uit.edu.vn`, normalize `email`, hash password, tạo `account_type = PERSONAL`, `account_status = UNVERIFIED` và `system_role = USER`.
- Cấp `account_token` dùng một lần với `purpose = EMAIL_VERIFICATION`; chỉ lưu `token_hash`, enforce `expires_at`, đồng thời set `consumed_at`, `user_account.email_verified_at` và `account_status = ACTIVE` một cách atomic.
- Implement `GET/PATCH /api/me`; ban đầu chỉ cho phép thay đổi `full_name` và update `updated_at`.
- Test duplicate email, từ chối UIT domain, token expired/consumed và authorization cho inactive account.

#### Step 1.1.2 — FE

- Xây dựng các page registration, verification-result và profile bằng các field map tới `user_account.email` và `user_account.full_name`.
- Cung cấp password rules đáp ứng accessibility, feedback khi resend verification và các state `UNVERIFIED`, `ACTIVE`, `BANNED` rõ ràng.
- Không expose `password_hash`, `token_hash`, khả năng thay đổi `system_role` hoặc internal ID khi không cần thiết.

#### Step 1.1.3 — Integration

- Kết nối register → email-provider stub → verify → profile update.
- Xác nhận database đổi `user_account.account_status` từ `UNVERIFIED` sang `ACTIVE`, set `email_verified_at` và chỉ đánh dấu `account_token.consumed_at` một lần.
- Acceptance: account chưa verify không thể truy cập main route; account đã verify có thể truy cập; verification token được replay phải thất bại an toàn.

### Feature 1.2 — Login, refresh rotation, logout, and authorization context

**User stories:** AUTH-02 và shared session behavior mà mọi protected story đều cần.

**Database:** `user_account(id, email, account_status, system_role)` và `refresh_session(id, user_id, token_hash, expires_at, revoked_at, created_at)`.

#### Step 1.2.1 — BE

- Implement `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout` và `/api/auth/logout-all`.
- Khi login, tạo `refresh_session`bên trong cache hoặc redis. Thực hiện trả về `accessToken` và `refreshToken ` cho người dùng 
- Đưa `user_account.id`, `system_role` và session/version claims vào access-token security context, sau đó kiểm tra lại `account_status = ACTIVE` cho protected request.
- Trả về lỗi authentication chung cho email không tồn tại, password sai, account `UNVERIFIED` và `BANNED` trong các trường hợp việc tiết lộ thông tin không an toàn.

#### Step 1.2.2 — FE

- Xây dựng flow login/logout và session restoration mà không lưu raw refresh token trong storage JavaScript có thể đọc; ưu tiên secure cookie transport cho refresh.
- Thêm authenticated route guard và admin route guard dựa trên `/api/me`, nhưng xem BE authorization là nguồn quyết định chính thức.
- Khi refresh thất bại, xóa private data đã cache và quay về login với lý do không chứa dữ liệu nhạy cảm.

#### Step 1.2.3 — Integration

- Kết nối login, automatic access-token refresh, logout và logout-all trên nhiều browser session.
- Acceptance: user `ACTIVE` vào được app, user `UNVERIFIED`/`BANNED` không vào được, và chỉ `system_role = ADMIN` mới mở quyền truy cập admin APIs.

### Feature 1.3 — Password reset/change and email change

**User stories:** AUTH-05, AUTH-06, AUTH-07.

**Database:** `account_token.purpose` có các giá trị `PASSWORD_RESET` và `EMAIL_CHANGE`; `user_account.email`, `password_hash`, `account_status`, `email_verified_at`, `updated_at`; tất cả row `refresh_session.revoked_at` đang active của user.

#### Step 1.3.1 — BE

- Thêm request/confirm endpoint cho password reset với response chung; enforce `token_hash` dùng một lần, `expires_at` và `consumed_at`.
- Thêm authenticated password change thông qua email cá nhân.
- Thêm request/confirm cho email change; từ chối `@uit.edu.vn`, reserve email mới và unique một cách an toàn, sau đó update `user_account.email`, clear `email_verified_at` và set `account_status = UNVERIFIED` cho đến khi confirm.
- Sau khi thay đổi password hoặc email credential, set `revoked_at` trên mọi `refresh_session` còn hiệu lực của `user_id`.

#### Step 1.3.2 — FE

- Xây dựng các form forgot/reset-password, change-password và change-email với success state không làm lộ việc account có tồn tại hay không.
- Sau khi credential thay đổi, clear session và hiển thị action re-verification/re-login cần thực hiện.

#### Step 1.3.3 — Integration

- Thực thi mỗi email link một lần, sau đó thử replay và để link expire.
- Verify `account_token.purpose`, `consumed_at`, các account field và những session đã revoke.
- Acceptance: thay đổi credential làm vô hiệu refresh token cũ; email change chặn các feature chính cho đến khi email mới được verify.

### Feature 1.4 — UIT SSO

**User story:** AUTH-01.

**Database:** `user_account.account_type = UIT`, `uit_subject`, `email`, `password_hash = null`, `account_status`, `email_verified_at`, `full_name` và cùng lifecycle `refresh_session`.

#### Step 1.4.1 — BE

- Implement authorization-code SSO với state/nonce và callback validation theo cấu hình chính thức của UIT provider.
- Upsert theo `user_account.uit_subject` immutable, validate email `@uit.edu.vn` được trả về, tuyệt đối không lưu UIT password và create/update local profile.
- Cấp cùng loại application access/refresh session như personal login. Xác định hành vi an toàn khi UIT email thay đổi và khi local account bị banned.

#### Step 1.4.2 — FE

- Thêm “Continue with UIT” vào login, một SSO callback page, xử lý cancel/error và cùng post-login session bootstrap.

#### Step 1.4.3 — Integration

- Test với provider sandbox hoặc protocol-faithful stub cho các trường hợp success, state/nonce không hợp lệ, callback replay, email thay đổi và account `BANNED`.
- Acceptance: một `uit_subject` map tới một `user_account`, `password_hash` luôn là null, và app token—not UIT credential—authorize các application feature.

### Checkpoint — Identity

- AUTH-01 đến AUTH-08 chạy thành công end to end.
- Các test về authentication, account status và `system_role` authorization đều chạy thành công.
- OpenAPI session contract không chứa password hash hoặc raw durable token value.

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

- Thêm owner invite dialog, link settings (`expires_at`, `max_uses`), action revoke/copy, action trên direct-invite notification và invite-link landing page.
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

## Phase 4 — Video calls and screen sharing

### Feature 4.1 — Start, join, leave, and end one call per server

**User stories:** CALL-01, CALL-02, CALL-03.

**Database:** `call_session(id, server_id, coordinator_user_id, status, livekit_room_name, active_screen_sharer_user_id, started_at, ended_at)` và `call_participation(id, call_session_id, user_id, joined_at, left_at)`.

#### Step 4.1.1 — BE/LiveKit

- Start call dưới server-level lock; set requester làm `coordinator_user_id`, generate `livekit_room_name` unique và set `started_at`.
- Chỉ cấp LiveKit token short-lived, có room scope cho active member. Dưới call lock, giới hạn active participation ở mức 30.
- Xử lý signed LiveKit webhook theo cách idempotent để open/close `call_participation`; khi participant cuối cùng leave, set `call_session.status = ENDED` và `ended_at`.

#### Step 4.1.2 — FE

- Xây dựng call lobby/in-call UI, xử lý device permission, mic/camera toggle, participant grid, active call banner và quyền truy cập liên tục tới server chat.
- Xử lý full call, ended call, reconnect, device bị từ chối và LiveKit failure.

#### Step 4.1.3 — Integration

- Kết nối start/token/join/webhook/leave/end với LiveKit test infrastructure.
- Acceptance: các lần start đồng thời chỉ tạo một active call, participant thứ 31 bị từ chối, non-member không nhận token và không bật recording.

### Feature 4.2 — Single screen sharer and coordinator controls

**User stories:** CALL-04, CALL-05, CALL-06.

**Database:** `call_session.active_screen_sharer_user_id` và `call_event(id, call_session_id, actor_user_id, target_user_id, event_type, created_at)` sử dụng `FORCE_MUTE`, `SCREEN_SHARE_STARTED`, `SCREEN_SHARE_STOPPED`, `FORCE_SCREEN_SHARE_STOP`.

#### Step 4.2.1 — BE/LiveKit

- Serialize thao tác start/stop screen-share trên `call_session`; set/clear `active_screen_sharer_user_id` và append `call_event` tương ứng.
- Chỉ cho phép force mute/stop-share khi `actor_user_id = coordinator_user_id` và coordinator đó có `call_participation.left_at = null` đang active.
- Chỉ gọi LiveKit server API sau authorization; ghi lại control event thành công và clear sharer state cũ từ signed webhook.

#### Step 4.2.2 — FE

- Thêm control share/stop, feedback cho single-sharer, participant control chỉ dành cho coordinator và disable coordinator action khi coordinator vắng mặt.

#### Step 4.2.3 — Integration

- Cho hai share attempt chạy race và test coordinator leave/rejoin.
- Acceptance: chỉ tồn tại một `active_screen_sharer_user_id`, chỉ có owner status không đủ để có call-control permission, và coordinator ban đầu chỉ lấy lại control sau khi rejoin.

### Checkpoint — Calls

- CALL-01 đến CALL-06 chạy thành công, gồm các test 30-participant, single-call, single-sharer, webhook replay và privacy.

## Phase 5 — Document library, classification, and moderation

### Feature 5.1 — Admin-managed categories and collections

**User story:** DOC-05.

**Database:** `category(id, name, created_at, updated_at)`, `collection(id, name, description, slug, created_at, updated_at)` và `collection_category(collection_id, category_id, created_at)`.

#### Step 5.1.1 — BE

- Thêm admin CRUD và public read API; bảo vệ các thao tác delete có thể làm mất hiệu lực classification link hiện có.

#### Step 5.1.2 — FE

- Xây dựng admin category/collection list, create/edit form, slug validation và category assignment; thêm các primitive để browse public collection.

#### Step 5.1.3 — Integration

- Kết nối CRUD và assignment cùng conflict handling.
- Acceptance: chỉ `system_role = ADMIN` có thể mutate taxonomy, public user có thể read và duplicate name/slug thất bại theo cách có thể dự đoán.

### Feature 5.2 — Private upload, quarantine, scanning, and submission

**User story:** DOC-03.

**Database:** `media(id, uploaded_by_user_id, file_name, mime_type, size_bytes, object_key, status, scan_completed_at, created_at)`, `document(id, uploaded_by_user_id, media_id, title, description, tags, slug, visibility_status, created_at, updated_at, removed_by_user_id, removed_at, removal_reason)` và `document_submission(id, document_id, submitted_by_user_id, status, submitted_at, reviewed_by_user_id, reviewed_at, rejection_reason, purge_at)`.

#### Step 5.2.1 — BE/workers

- Tích hợp private S3-compatible object storage.
- Tạo upload-init endpoint để validate file name, `mime_type` đã khai báo, `size_bytes`, title, description và tag; tạo `media.status = QUARANTINED`, `document.visibility_status = HIDDEN` và `document_submission.status = PENDING_PROCESSING`.
- Trả về signed upload URL short-lived bằng `media.object_key` opaque; khi hoàn tất, verify size/signature và queue malware scanning.
- Set `media.status = SCANNING`, sau đó chuyển thành `READY` kèm `scan_completed_at` hoặc `REJECTED`; file bị reject tuyệt đối không được chuyển sang OCR hoặc public download.

#### Step 5.2.2 — FE

- Xây dựng upload form, direct-to-storage progress, validation, retry và status view “my submissions” bằng `media.status` và `document_submission.status`.
- Tuyệt đối không expose `object_key` dưới dạng permanent public URL.

#### Step 5.2.3 — Integration

- Kết nối init → signed upload → completion → scan status polling/event.
- Acceptance: file invalid/oversized/malicious vẫn private, chỉ uploader/admin thấy pending item và mọi `document.media_id` đều tham chiếu đúng row `media` dự kiến.

### Feature 5.3 — OCR and agent classification recommendation

**User story:** DOC-11.

**Database:** `agent_classification(id, document_submission_id, model_id, classification_run_id, ocr_text, created_at)`, `agent_classification_collection(agent_classification_id, collection_id, confidence, created_at)` và `agent_classification_category(agent_classification_id, category_id, confidence, created_at)`.

#### Step 5.3.1 — BE/workers

- Chỉ chạy OCR cho `media.status = READY`; tạo một idempotent run theo key `classification_run_id` unique.
- Lưu OCR output trong `agent_classification.ocr_text`, model provenance trong `model_id` và các collection/category hiện có được đề xuất với `confidence` bị giới hạn trong `[0,1]`.
- Xem worker output là untrusted. Output có thể chuyển `document_submission.status` từ `PENDING_PROCESSING` sang `PENDING_REVIEW`, nhưng không được set `APPROVED`, đổi `document.visibility_status` thành `PUBLIC` hoặc tạo taxonomy.

#### Step 5.3.2 — FE

- Xây dựng admin review panel cho OCR text, collection/category được đề xuất, confidence, processing failure/retry và file preview qua authorized signed URL.

#### Step 5.3.3 — Integration

- Kết nối Kafka job, retry, idempotent callback và admin queue refresh.
- Acceptance: duplicate worker completion chỉ tạo một classification run, confidence luôn trong giới hạn và không AI result nào trực tiếp publish document.

### Feature 5.4 — Human document review, publication, rejection, and removal

**User stories:** DOC-06, DOC-07, DOC-08, DOC-09, DOC-10.

**Database:** các review field trên `document_submission`; `document.visibility_status`, `tags`, các removal field; `document_collection`, `document_category`; `notification` với các kind `DOCUMENT_REJECTED` và `DOCUMENT_REPORTED`; `audit_log` khi có sensitive access; `outbox_event`.

#### Step 5.4.1 — BE

- Thêm admin queue theo `document_submission.status` và quyết định approve/reject theo transaction.
- Approval yêu cầu final `document_collection` assignment, các row `document_category` optional, `document.tags` đã normalize, `reviewed_by_user_id` và `reviewed_at`; set submission thành `APPROVED` và document thành `PUBLIC`.
- Rejection yêu cầu `rejection_reason`, set `status = REJECTED`, `reviewed_by_user_id`, `reviewed_at`, `purge_at <= reviewed_at + 90 days` và tạo notification `DOCUMENT_REJECTED`.
- Removal set `document.visibility_status = REMOVED`, `removed_by_user_id`, `removed_at` và `removal_reason` bắt buộc; `report_evidence` đã preserve không thay đổi.

#### Step 5.4.2 — FE

- Xây dựng moderation queue có status filter, control để so sánh agent suggestion, chỉnh sửa final collection/category/tag, approve/reject với reason bắt buộc và remove confirmation.
- Update contributor submission view và notification link.

#### Step 5.4.3 — Integration

- Kết nối decision action và realtime notification; verify public visibility chỉ thay đổi sau commit.
- Acceptance: admin—not agent—set final status; item bị reject/remove không xuất hiện trong public API; uploader nhận notification được chỉ định mà không có reporter identity.

### Feature 5.5 — Public search, secure download, and rejected resubmission

**User stories:** DOC-01, DOC-02, DOC-04.

**Database:** public filter trên `document.visibility_status = PUBLIC`, `document_submission.status = APPROVED` mới nhất đã approve, `document.title`, `tags`, `document_collection`, `collection.slug` và `agent_classification.ocr_text` đã approve.

#### Step 5.5.1 — BE

- Thêm PostgreSQL full-text index cho title và OCR text đã approve, cùng các index cho tag và collection join.
- Implement public search theo title, tag, collection và OCR, đồng thời loại trừ document `HIDDEN`/`REMOVED` và submission chưa approve.
- Chỉ cấp download/preview URL short-lived sau khi kiểm tra visibility và permission hiện tại.
- Khi resubmission, giữ nguyên `document.id`, tạo `document_submission.id` append-only mới, reset visibility thành `HIDDEN` và chạy lại scan/OCR/classification nếu changed content yêu cầu.

#### Step 5.5.2 — FE

- Xây dựng các page public library/search/filter/detail/download và contributor resubmission flow hiển thị submission history cùng rejection reason.

#### Step 5.5.3 — Integration

- Verify search result và signed URL bị invalidate sau removal, đồng thời resubmission được tách biệt với lần thử bị reject.
- Acceptance: chỉ document đã approve/public mới có thể search/download, OCR search dùng submission đã approve và resubmission tạo một row `document_submission` mới.

### Checkpoint — Documents

- DOC-01 đến DOC-11 chạy thành công từ upload tới publication/search/resubmission.
- Object storage luôn private; AI không thể publish; các test về rejected retention và bảo toàn report đều chạy thành công.

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

## Database coverage checklist

Toàn bộ table, database model và full-schema migration được implement tại Step 1.1.1. Bảng dưới đây chỉ thể hiện feature sử dụng chính của từng nhóm table.

| Tables                                                                                                | Primary usage feature                                               |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `user_account`, `account_token`, `refresh_session`                                              | 1.1–1.4                                                            |
| `outbox_event`                                                                                      | 0.2, sau đó được reuse bởi mọi realtime/notification feature |
| `notification`                                                                                      | 2.1, sau đó được reuse bởi invite/document/forum              |
| `server`, `server_membership`, `server_invite`                                                  | 2.2–2.4                                                            |
| `chat_message`, `react_icon`, `message_reaction`                                                | 3.1–3.3                                                            |
| `call_session`, `call_participation`, `call_event`                                              | 4.1–4.2                                                            |
| `media`, `document`, `document_submission`                                                      | 5.2, 5.4–5.5                                                       |
| `agent_classification`, `agent_classification_collection`, `agent_classification_category`      | 5.3                                                                 |
| `category`, `collection`, `document_category`, `document_collection`, `collection_category` | 5.1, 5.4                                                            |
| `forum_post`, `comment`, `anonymous_alias`, `post_reaction`, `comment_reaction`             | 6.1–6.3                                                            |
| `report`, `report_evidence`, `audit_log`                                                        | 7.1–7.3                                                            |

## Traceability summary

| Product area   | Stories      | Plan features                                              |
| -------------- | ------------ | ---------------------------------------------------------- |
| Identity       | AUTH-01–08  | 1.1–1.4                                                   |
| Servers        | SRV-01–09   | 2.2–2.4, 6.3                                              |
| Chat           | CHAT-01–04  | 3.1–3.2                                                   |
| Calls          | CALL-01–06  | 4.1–4.2                                                   |
| Documents      | DOC-01–11   | 5.1–5.5                                                   |
| Forum          | FORUM-01–11 | 6.1–6.3, 7.2                                              |
| Reports        | RPT-01–04   | 7.1–7.2                                                   |
| Notifications  | NOTI-01–03  | 2.1 cùng các producer riêng của từng feature          |
| Administration | ADMIN-01–04 | 7.2–7.3 cùng các admin screen riêng của từng feature |

## Risks and required decision gates

| Risk/decision                                                                                  | Impact                                                 | Required action before implementation                                                                                             |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Chưa có UIT SSO contract và sandbox                                                         | Chặn AUTH-01                                          | Lấy issuer, endpoint, client registration, claim mapping và test tenant trong Phase 1; giữ protocol-faithful stub cho CI.      |
| Chưa có Socket.IO gateway trong repository                                                   | Chặn việc delivery state của chat/notification/call | Thêm`app/realtime-gateway` trong Phase 0 và giữ Spring Boot làm nơi quyết định business rule.                           |
| Chưa chọn/cấu hình provider cho object storage, malware scanner, OCR/AI, email và LiveKit | Chặn external integration                             | Trước tiên định nghĩa provider interface và local fake; chọn production provider trước phase của feature tương ứng. |
| Code JWT và user lookup hiện tại chỉ là prototype                                         | Rủi ro về security và correctness                   | Thay thế và rotate cấu hình trong Phase 0/1 trước khi expose protected API.                                                 |
| Hai FE lockfile cho thấy đang dùng các package manager cạnh tranh                         | Build không reproducible                              | Thống nhất npm trong Phase 0, trừ khi nhóm ghi nhận rõ một lựa chọn khác.                                               |
| AI/OCR output có thể malformed hoặc adversarial                                             | Publication/moderation không chính xác              | Validate toàn bộ worker output; chỉ cho phép recommendation; yêu cầu admin đưa ra quyết định rõ ràng.                |
| Các thay đổi invite, owner, call và screen-share diễn ra đồng thời                     | State bị duplicate/invalid                            | Dùng PostgreSQL constraint cùng row lock và concurrency integration test tại mỗi feature step.                               |

## Explicit out-of-scope boundaries

Không thêm direct message, public server discovery, nhiều chat/call channel trên mỗi server, simultaneous call trên mỗi server, simultaneous screen sharer, default call recording, hidden admin call access, quyền browse private chat không giới hạn, forum topic bắt buộc do admin quản lý hoặc scale vượt quá target đã ghi trong tài liệu. Mọi scope change đều yêu cầu update requirements và `docs/DATABASE.txt` trước khi implementation.
