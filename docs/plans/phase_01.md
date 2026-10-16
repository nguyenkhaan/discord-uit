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
