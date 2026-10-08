# UIT Connect — Screen outline

Nguồn: [Screen list](screen_list.md), [Theme](theme.md), [Database](../DATABASE.txt), [Yêu cầu](../documents/requirement.md), [User stories](../documents/user-story.md).

28 màn hình: A01–A08, U01–U10, M01–M10. Mỗi mục gồm tên màn hình, wireframe và Screen Notes. Các drawer/dialog nằm trong màn hình mở chúng, không tạo route mới. Nội dung trong khung là giao diện; ghi chú bên ngoài dành cho thiết kế và triển khai.

### Quy ước hình vẽ và dữ liệu

- `{...}` là giá trị từ schema hoặc phép tổng hợp được chỉ rõ trong Data Binding; không phải dữ liệu mẫu. `[Nút]`, `[Nhập...]`, `[Chọn v]`, `[x]`, `(o)` biểu diễn control; `*` đánh dấu lựa chọn hiện tại. Những khung “Trạng thái”, “Dialog” là các biến thể, không hiển thị đồng thời trên màn hình chính.
- Mật khẩu, token liên kết, xác nhận mật khẩu, truy vấn tìm kiếm, bộ lọc, tiến trình truyền tệp và thiết bị gọi là đầu vào/trạng thái tạm thời. Không thêm cột dữ liệu cho chúng. Không hiển thị hash, object key, refresh token, UIT subject hoặc định danh phòng media nội bộ.
- Tên người dùng chỉ lấy `user_account.full_name`; ảnh đại diện người dùng dùng chữ cái đầu suy ra từ tên, không giả định trường avatar. Ảnh server lấy `server.group_image_url`. Nội dung ẩn danh dùng `anonymous_alias.display_alias` đúng phạm vi bài viết.
- Danh sách dùng phân trang/tải tiếp theo kết quả thực tế; không giả lập số trang, số lượt xem, lượt tải, tỷ lệ tăng trưởng hay trạng thái online. Count chỉ tính trên bản ghi người xem được phép truy cập.

### Áp dụng theme cho toàn bộ wireframe

- Dùng nguyên token trong [theme.md](theme.md): primary `--color-primary` #5865F2, hover `--color-primary-hover` #4752C4; canvas/surface/raised theo chế độ sáng/tối; border `--color-border`; chữ primary/on-dark/subdued theo nền. Không tạo palette mới. Success/warning/danger/info luôn kèm nhãn trạng thái. Màu muted chỉ dùng khi đạt tương phản yêu cầu của theme trên nền thực tế.
- `[Gửi]`, `[Lưu]` và CTA chính dùng primary; tham gia/duyệt dùng secondary hoặc success theo theme; nút hủy/gỡ cuối cùng dùng danger; nút phụ neutral/ghost. Tab hiện tại có gạch chỉ báo và chữ đậm, không chỉ đổi màu.
- Inter: H1 28/36–700, H2 22/30–650–700, H3 18/26–600–700; body 16/24, compact 14/20, small 12/16, button/nav 14/20–600. Số và thời gian dùng tabular figures. Form mobile dùng chữ 16 px.
- Header 64 px; nội dung danh sách tối đa 1280 px, cột đọc 760 px; auth card 420–480 px; call không giới hạn chiều rộng. Grid desktop >=1280: 12 cột/gutter 24/margin 32; tablet 768–1279: 8/20/24; mobile <768: 4/16/16. Breakpoint điều khiển theo theme: <480, 480–767, 768–1023, 1024–1439, >=1440.
- Spacing 4/8/12/16/24/32/40/48/64 px; padding card 16–24, khoảng title–content 24, nhóm control 16, section 32. Radius control 8, card 12, dialog/media 16 px. Border 1 px; shadow menu/dialog `0 8px 24px rgba(0,0,0,.14)`.
- Nút desktop 40 px, compact 36 px; vùng bấm mobile tối thiểu 44 px; input tối thiểu 40 px. Hover/drawer/toast 120–180 ms ease-out, tắt motion không thiết yếu khi reduced-motion. Focus sáng dùng vòng primary; nền tối thêm vòng trong trắng 2 px và vòng ngoài primary 2 px.
- Khung bên dưới mô tả desktop. Mobile thu gọn header thành menu điều hướng, ưu tiên Server/Tài liệu/Diễn đàn/Thông báo/Tài khoản; admin sidebar thành drawer. Hai cột xếp dọc dưới 768 px; bảng thành record card; cột phụ thành drawer; dock không che focus hoặc bàn phím. Không loại bỏ tác vụ vì thiếu chiều rộng.

### Shell và trạng thái dùng chung

`[Thông báo]` và `[Tài khoản]` xuất hiện trong user/admin header; riêng call shell U03 chuyển chúng vào menu `[Thêm]` để ưu tiên media và dock cuộc gọi. Account menu mở A08, U07, đăng xuất và M01 chỉ khi Admin. `[Sáng/tối]` theo OS ban đầu và lưu lựa chọn cục bộ, không thêm trường user. Breadcrumb thể hiện đường quay lại; menu mobile giữ các điểm đến tương đương.

Mỗi vùng bất đồng bộ dùng các trạng thái dưới đây ngay trong vùng tương ứng, không dựng trang route mới:

```text
+--------------------------------------------------------------------------+
| Đang tải...                                                              |
| [============================]  [==============]                         |
|------------------------------------------------------------------------  |
| Chưa có dữ liệu.                         [Tác vụ phù hợp màn hình]       |
| Không có kết quả.                        [Xóa bộ lọc]                    |
| Không tải được dữ liệu.                  [Thử lại]                       |
| Bạn không có quyền xem nội dung này.     [Quay lại]                      |
+--------------------------------------------------------------------------+
```

Giữ nội dung form khi lỗi có thể phục hồi; lỗi nằm dưới trường, focus đến lỗi đầu tiên. Dialog có tên, nút Đóng, focus trap, Escape và trả focus về trigger; nếu có nội dung chưa gửi, xác nhận trước khi bỏ. Trạng thái gửi được thông báo cho công nghệ hỗ trợ và ngăn gửi lặp. Chỉ reaction có thể optimistic và rollback khi lỗi; lời mời, quyết định duyệt, thao tác xóa và đọc nhạy cảm chờ server xác nhận. Hết phiên: xóa dữ liệu riêng ở frontend, về A01; UNVERIFIED chỉ vào xác thực; BANNED không tạo phiên. Backend kiểm tra lại mọi quyền.

---

## A01 — Đăng nhập

```text
+--------------------------------------------------------------------------------------------------+
| UIT Connect                                                                           [Sáng/tối] |
|                             +-------------------------------------------+                        |
|                             | Đăng nhập                                 |                        |
|                             | [Tiếp tục với UIT]                         |                       |
|                             | ---------------- hoặc ------------------- |                        |
|                             | Email cá nhân                             |                        |
|                             | [Nhập email............................]  |                        |
|                             | Mật khẩu                                  |                        |
|                             | [................................][Hiện]  |                        |
|                             | [Quên mật khẩu?]                          |                        |
|                             | [Đăng nhập]                               |                        |
|                             | Chưa có tài khoản? [Đăng ký]              |                        |
|                             +-------------------------------------------+                        |
+--------------------------------------------------------------------------------------------------+
```

**Screen Notes:**

- **Route / Quyền:** `/login` · `LoginPage.tsx` — Khách.
- **UX Goal:** Hai đường đăng nhập rõ ràng, một điểm vào ứng dụng.
- **Data Binding:** `user_account.email, account_type, account_status`; mật khẩu nhập được kiểm tra với `password_hash` phía server. Phiên dựa trên `refresh_session.user_id, expires_at, revoked_at`; không render dữ liệu bí mật.
- **Key Interactions:** SSO → A06; đăng ký → A02; quên mật khẩu → A04. Email UIT chuyển sang SSO, không yêu cầu mật khẩu UIT. ACTIVE → U01 hoặc lời mời đã mở; UNVERIFIED → A03.
- **Trạng thái / Responsive:** Sai thông tin: lỗi chung dưới form; BANNED: “Tài khoản đã bị khóa”; đang gửi giữ kích thước CTA. Card co theo viewport.

---

## A02 — Đăng ký

```text
+--------------------------------------------------------------------------------------------------+
| UIT Connect                                                                           [Sáng/tối] |
|                             +-------------------------------------------+                        |
|                             | Tạo tài khoản                             |                        |
|                             | Họ tên                                    |                        |
|                             | [.......................................] |                        |
|                             | Email cá nhân                             |                        |
|                             | [.......................................] |                        |
|                             | Email @uit.edu.vn dùng [Đăng nhập UIT].   |                        |
|                             | Mật khẩu                                  |                        |
|                             | [................................][Hiện]  |                        |
|                             | [Tạo tài khoản]                           |                        |
|                             | Đã có tài khoản? [Đăng nhập]              |                        |
|                             +-------------------------------------------+                        |
+--------------------------------------------------------------------------------------------------+
```

**Screen Notes:**

- **Route / Quyền:** `/register` · `RegisterPage.tsx` — Khách.
- **UX Goal:** Thu thập đúng ba thông tin đăng ký cần thiết.
- **Data Binding:** `user_account.full_name, email, account_type=PERSONAL, account_status=UNVERIFIED`; mật khẩu → `password_hash` tại backend; xác thực qua `account_token.purpose=EMAIL_VERIFICATION, expires_at, consumed_at`.
- **Key Interactions:** Chặn email UIT ở cả form và backend. Thành công mở trạng thái kiểm tra email trong A03. Không tự mở user workspace trước xác thực.
- **Trạng thái / Responsive:** Lỗi trường đặt sát input; giữ họ tên/email khi lỗi; yêu cầu mật khẩu theo chính sách server, không tự đặt độ dài mới.

---

## A03 — Xác thực email

```text
+--------------------------------------------------------------------------------------------------+
| UIT Connect                                                                           [Sáng/tối] |
|                             +-------------------------------------------+                        |
|                             | Xác thực email                            |                        |
|                             | Kiểm tra email để mở liên kết xác thực.   |                        |
|                             | [Gửi lại email xác thực]                  |                        |
|                             | [Về đăng nhập]                            |                        |
|                             +-------------------------------------------+                        |
| Biến thể khi mở liên kết                                                                         |
| +------------------------------+------------------------------+-------------------------------+  |
| | Đang xác thực...             | Email đã được xác thực.      | Liên kết không còn hiệu lực.  |  |
| | [Đang xử lý...]              | [Đăng nhập]                  | [Gửi lại] [Về đăng nhập]       | |
| +------------------------------+------------------------------+-------------------------------+  |
+--------------------------------------------------------------------------------------------------+
```

**Screen Notes:**

- **Route / Quyền:** `/verify-email` · `EmailVerificationPage.tsx` — Khách hoặc UNVERIFIED.
- **UX Goal:** Thể hiện kết quả xác thực và bước tiếp theo duy nhất.
- **Data Binding:** `account_token.user_id, purpose` (`EMAIL_VERIFICATION` hoặc `EMAIL_CHANGE`), `expires_at, consumed_at`; `user_account.email_verified_at, account_status`. Token đầu vào chỉ dùng để xác thực.
- **Key Interactions:** Luồng dùng liên kết một lần, không thêm bộ đếm OTP. Gửi lại qua ngữ cảnh xác thực hiện có; nếu mất ngữ cảnh, thu email làm đầu vào và trả phản hồi chung.
- **Trạng thái / Responsive:** Hết hạn/đã dùng/không hợp lệ đều có đường gửi lại an toàn; lỗi mạng có Thử lại. Xác thực đổi email tuân cùng gate UNVERIFIED.

---

## A04 — Quên mật khẩu

```text
+--------------------------------------------------------------------------------------------------+
| UIT Connect                                                                           [Sáng/tối] |
|                             +-------------------------------------------+                        |
|                             | Quên mật khẩu                             |                        |
|                             | Email cá nhân                             |                        |
|                             | [.......................................] |                        |
|                             | [Gửi liên kết đặt lại]                    |                        |
|                             | [Về đăng nhập]                            |                        |
|                             +-------------------------------------------+                        |
| Sau yêu cầu                                                                                      |
|                             +-------------------------------------------+                        |
|                             | Nếu email phù hợp, bạn sẽ nhận được       |                        |
|                             | hướng dẫn đặt lại mật khẩu.               |                        |
|                             | [Về đăng nhập]                            |                        |
|                             +-------------------------------------------+                        |
+--------------------------------------------------------------------------------------------------+
```

**Screen Notes:**

- **Route / Quyền:** `/forgot-password` · `ForgotPasswordPage.tsx` — Khách.
- **UX Goal:** Khôi phục truy cập với phản hồi bảo vệ riêng tư.
- **Data Binding:** Email đầu vào tra cứu `user_account.email, account_type`; backend dùng `account_token.purpose=PASSWORD_RESET, expires_at, consumed_at`.
- **Key Interactions:** Không thay đổi câu trả lời theo sự tồn tại của tài khoản. UIT dùng SSO. Link trong email → A05.
- **Trạng thái / Responsive:** Lỗi định dạng email tại trường; lỗi gửi mạng cho phép thử lại nhưng không tiết lộ trạng thái tài khoản.

---

## A05 — Đặt lại mật khẩu

```text
+--------------------------------------------------------------------------------------------------+
| UIT Connect                                                                           [Sáng/tối] |
|                             +-------------------------------------------+                        |
|                             | Đặt lại mật khẩu                          |                        |
|                             | Mật khẩu mới                              |                        |
|                             | [................................][Hiện]  |                        |
|                             | Xác nhận mật khẩu                         |                        |
|                             | [.......................................] |                        |
|                             | [Lưu mật khẩu mới]                        |                        |
|                             +-------------------------------------------+                        |
| Token hết hạn / đã dùng:  Liên kết không còn hiệu lực. [Yêu cầu liên kết mới]                    |
| Thành công:              Đã đổi mật khẩu.             [Đăng nhập]                                |
+--------------------------------------------------------------------------------------------------+
```

**Screen Notes:**

- **Route / Quyền:** `/reset-password` · `ResetPasswordPage.tsx` — Khách có token hợp lệ.
- **UX Goal:** Đổi mật khẩu một lần với kết quả rõ ràng.
- **Data Binding:** `account_token.purpose=PASSWORD_RESET, expires_at, consumed_at`; cập nhật `user_account.password_hash`; thu hồi `refresh_session.revoked_at`. Xác nhận mật khẩu là input tạm.
- **Key Interactions:** Kiểm tra token trước khi mở form; thành công tiêu thụ token, thu hồi phiên cũ rồi về A01; link mới → A04.
- **Trạng thái / Responsive:** Mật khẩu không khớp báo inline; token hết hạn trong lúc gửi thay CTA bằng đường yêu cầu mới.

---

## A06 — Hoàn tất đăng nhập UIT

```text
+--------------------------------------------------------------------------------------------------+
| UIT Connect                                                                           [Sáng/tối] |
|                             +-------------------------------------------+                        |
|                             | Đang hoàn tất đăng nhập UIT...            |                        |
|                             | [============================]            |                        |
|                             +-------------------------------------------+                        |
| Lỗi hoặc hủy đăng nhập                                                                           |
|                             +-------------------------------------------+                        |
|                             | Chưa thể hoàn tất đăng nhập UIT.          |                        |
|                             | [Đăng nhập UIT lại] [Về đăng nhập]         |                       |
|                             +-------------------------------------------+                        |
+--------------------------------------------------------------------------------------------------+
```

**Screen Notes:**

- **Route / Quyền:** `/auth/uit/callback` · `UitSsoCallbackPage.tsx` — Khách.
- **UX Goal:** Hoàn tất chuyển tiếp ngắn gọn, không lộ chi tiết giao thức.
- **Data Binding:** `user_account.account_type=UIT, uit_subject, email, full_name, account_status`; `refresh_session.user_id, expires_at, revoked_at`. Không render `uit_subject` hay mã callback.
- **Key Interactions:** Xác thực callback phía server; thành công chuyển U01/đích lời mời hợp lệ. Thử lại bắt đầu luồng SSO mới, không replay callback.
- **Trạng thái / Responsive:** Không hỏi mật khẩu UIT; callback lỗi/hủy có lối quay lại; trạng thái tài khoản kiểm tra trước khi cấp workspace.

---

## A07 — Lời mời server

```text
+--------------------------------------------------------------------------------------------------+
| UIT Connect                                                                           [Sáng/tối] |
|                             +-------------------------------------------+                        |
|                             | Lời mời tham gia server                    |                       |
|                             | [Ảnh server] {Tên server}                 |                        |
|                             | Hết hạn: {Thời hạn lời mời}                |                       |
|                             | [Tham gia server]                         |                        |
|                             +-------------------------------------------+                        |
| Khách:             [Đăng nhập để tiếp tục]                                                       |
| Đã là thành viên:  Bạn đã tham gia server này.                [Mở server]                        |
| Hết hạn:           Lời mời đã hết hạn.                        [Về server của tôi]                |
| Hết lượt:          Lời mời đã hết lượt sử dụng.                [Về server của tôi]               |
| Thu hồi:           Lời mời đã được thu hồi.                   [Về server của tôi]                |
| Không hợp lệ:      Không thể mở lời mời này.                  [Về đăng nhập]                     |
+--------------------------------------------------------------------------------------------------+
```

**Screen Notes:**

- **Route / Quyền:** `/invite/:token` · `ServerInvitePage.tsx` — Khách hoặc User.
- **UX Goal:** Một quyết định tham gia, không mở quyền khám phá server.
- **Data Binding:** `server.name, group_image_url`; `server_invite.server_id, invite_type, status, expires_at, max_uses, use_count`; `server_membership.user_id, server_id, left_at` xác định đã tham gia.
- **Key Interactions:** Khách chỉ thấy metadata lời mời backend cho phép, giữ đích mời khi đăng nhập. ACTIVE xác nhận join; backend kiểm tra lại hạn/lượt rồi mở U02.
- **Trạng thái / Responsive:** Các trạng thái thay thế CTA, không cho click join đã vô hiệu. Với khách, nút về workspace đổi thành về đăng nhập. Không tải danh sách thành viên trước join.

---

## A08 — Cài đặt tài khoản

```text
+---------------------------------------------------------------------------------------------------+
| UIT Connect | Server | Tài liệu | Diễn đàn                  [Thông báo] [Sáng/tối] [Tài khoản*]   |
| Tài khoản > Cài đặt                                                                               |
| Cài đặt tài khoản                                                                                 |
| [Hồ sơ*] [Bảo mật]                                                                                |
| +----------------------------------------------------------+-----------------------------------+  |
| | Họ tên                                                   | Tài khoản                         |  |
| | [{Họ tên}..............................................] | {Loại tài khoản}                  |  |
| | [Lưu thay đổi]                                           | {Trạng thái}                      |  |
| |                                                          | Email: {Email che một phần} [Hiện] | |
| +----------------------------------------------------------+-----------------------------------+  |
| Bảo mật - tài khoản cá nhân                                                                       |
| [Đổi mật khẩu]  [Đổi email]                                                                       |
| Tài khoản UIT: Xác thực được quản lý qua UIT.                                                     |
+---------------------------------------------------------------------------------------------------+
```

Dialog bảo mật (hai biến thể):

```text
+------------------------------------------------------------------------------------------------+
| Đổi mật khẩu                                                    [Đóng]                         |
| Mật khẩu hiện tại [............................]                                               |
| Mật khẩu mới      [............................] [Hiện]                                        |
| Xác nhận          [............................]                                               |
| [Hủy] [Đổi mật khẩu]                                                                           |
| -----------------------------------------------------------------------                        |
| Đổi email                                                       [Đóng]                         |
| Mật khẩu hiện tại [............................]                                               |
| Email mới         [............................]                                               |
| Sau khi đổi email, bạn sẽ tạm ngừng truy cập các chức năng của ứng dụng.                       |
| Xác thực email mới để tiếp tục sử dụng.                                                        |
| [Hủy] [Đổi email và gửi xác thực]                                                              |
+------------------------------------------------------------------------------------------------+
```

**Screen Notes:**

- **Route / Quyền:** `/settings/account` · `AccountSettingsPage.tsx` — User.
- **UX Goal:** Tách hồ sơ và xác thực để tránh thay đổi nhầm.
- **Data Binding:** `user_account.full_name, email, account_type, account_status, email_verified_at`; đổi mật khẩu → `password_hash`, thu hồi `refresh_session.revoked_at`; đổi email → `email, account_status=UNVERIFIED`, `account_token.purpose=EMAIL_CHANGE`.
- **Key Interactions:** Chỉ sửa họ tên trong hồ sơ. Dialog mật khẩu yêu cầu mật khẩu hiện tại; đổi email xác thực lại, từ chối email UIT. Trước nút xác nhận, hiển thị rõ việc tạm ngừng truy cập cho đến khi xác thực email mới; cho Hủy để giữ email hiện tại. Chỉ sau khi backend xác nhận đổi email mới chuyển A03; đổi lỗi giữ form và thông báo lỗi. Không thêm ảnh cá nhân, bio hay số điện thoại.
- **Trạng thái / Responsive:** Dialog full-width trên mobile; lỗi giữ input không bí mật. Không hiển thị đổi credential nội bộ cho UIT.

---

## U01 — Server của tôi

```text
+-------------------------------------------------------------------------------------------------+
| UIT Connect | Server* | Tài liệu | Diễn đàn                 [Thông báo] [Sáng/tối] [Tài khoản]  |
| Server của tôi                                                                  [Tạo server]    |
| +------------------------------+------------------------------+-------------------------------+ |
| | [Ảnh] {Tên server}           | [Ảnh] {Tên server}           | [Ảnh] {Tên server}            | |
| | {Vai trò của tôi}            | {Vai trò của tôi}            | {Vai trò của tôi}             | |
| | [Mở server]                  | [Mở server]                  | [Mở server]                   | |
| +------------------------------+------------------------------+-------------------------------+ |
| Chưa có server: Tạo server hoặc mở lời mời để tham gia.                         [Tạo server]    |
+-------------------------------------------------------------------------------------------------+
```

Dialog tạo server và drawer thông báo dùng chung:

```text
+------------------------------------------------------------------------------------------------+
| Tạo server                                                       [Đóng]                        |
| Tên server       [.............................................]                               |
| Liên kết ảnh nhóm (không bắt buộc) [..............................]                            |
| Để trống để dùng chữ đầu tên server.                                                           |
| [Hủy] [Tạo server]                                                                             |
| -----------------------------------------------------------------------                        |
| Thông báo                                                        [Đóng]                        |
| {Nội dung thông báo}                         {Thời gian} {Chưa đọc/Đã đọc}                     |
| [Mở nội dung] [Đánh dấu đã đọc] [Xóa thông báo]                                                |
| -----------------------------------------------------------------------                        |
| {Nội dung lời mời server}                                  {Thời gian}                         |
| [Chấp nhận] [Từ chối] [Xóa thông báo]                                                          |
| -----------------------------------------------------------------------                        |
| Chưa có thông báo.                                                                             |
+------------------------------------------------------------------------------------------------+
```

**Screen Notes:**

- **Route / Quyền:** `/servers` · `ServerListPage.tsx` — User.
- **UX Goal:** Chuyển nhóm nhanh với các server đã tham gia.
- **Data Binding:** `server.id, name, group_image_url, deleted_at`; lọc `server_membership.user_id=currentUser, left_at=null`, dùng `role`. Drawer thông báo: `notification.id, recipient_user_id, kind, content, related_entity_type, related_entity_id, read_at, deleted_at, created_at`; direct invite: `server_invite.recipient_user_id, status`.
- **Key Interactions:** Ảnh nhóm không bắt buộc; để trống hoặc ảnh không tải được thì hiển thị chữ đầu suy ra từ `server.name`, không thêm trường dữ liệu. Tạo server gán membership OWNER; mở card → U02. Chuông mở drawer dùng chung ở mọi màn hình đã đăng nhập; unread count đếm notification của người nhận chưa đọc/chưa xóa.
- **Trạng thái / Responsive:** Grid 3/2/1 cột; không search danh mục công khai. Drawer có tải/rỗng/lỗi và khóa action khi lời mời không còn PENDING.

---

## U02 — Không gian server

```text
+---------------------------------------------------------------------------------------------------+
| UIT Connect | Server* | Tài liệu | Diễn đàn                  [Thông báo] [Sáng/tối] [Tài khoản]   |
| Server của tôi > {Tên server}                                                                     |
| [Ảnh] {Tên server}                           [Thành viên] [Quản lý: Owner] [Report server]        |
| +------------------------------------------------------------+--------------------------------+   |
| | Cuộc gọi đang mở: {Số người}/30                 [Tham gia] | Thành viên              [Đóng] |   |
| |------------------------------------------------------------| {Họ tên}    {OWNER/MEMBER}      |  |
| | [Tải tin cũ hơn]                                           | [Report tài khoản]             |   |
| | {Họ tên} {Thời gian}                         [Thao tác v]   | {Họ tên}    {OWNER/MEMBER}      | |
| | {Nội dung tin nhắn}                                        | [Report tài khoản]             |   |
| | [{Tên reaction} {Số lượt}] [+ Reaction]                    |                                |   |
| | {Họ tên} {Thời gian} (Đã chỉnh sửa)          [Thao tác v]   | [Rời server]                   |  |
| | {Nội dung tin nhắn}                                        |                                |   |
| | +--------------------------------------------------------+ |                                |   |
| | | Tài liệu / Bài viết: {Tiêu đề nguồn}          [Mở nguồn] | |                                | |
| | +--------------------------------------------------------+ |                                |   |
| | Tin nhắn đã được xóa.                                     |                                |    |
| |------------------------------------------------------------|                                |   |
| | Tin nhắn [.....................................] [Gửi]    |                                |    |
| +------------------------------------------------------------+--------------------------------+   |
| Không có cuộc gọi: [Bắt đầu gọi]                                                                  |
| Mất kết nối: Đang kết nối lại... | Gửi lỗi: {Nội dung chưa gửi} [Thử lại]                         |
+---------------------------------------------------------------------------------------------------+
```

Drawer Owner và lời mời:

```text
+------------------------------------------------------------------------------------------------+
| Quản lý server                                                           [Đóng]                |
| [Thông tin*] [Thành viên] [Lời mời]                                                            |
| Tên server [{Tên server}........................................]                              |
| Liên kết ảnh nhóm (không bắt buộc) [{URL nếu có}..................]                            |
| Để trống để dùng chữ đầu tên server.                                                           |
| [Lưu thông tin]                                                                                |
| -----------------------------------------------------------------------                        |
| {Họ tên} | {Vai trò} | {Ngày tham gia}       [Nâng thành Owner] [Kick]                         |
| Xác nhận: Kick {Họ tên} khỏi {Tên server}?                 [Hủy] [Kick]                        |
| -----------------------------------------------------------------------                        |
| Mời trực tiếp: Người nhận [Tìm email / chọn tài khoản v]      [Gửi lời mời]                    |
| Liên kết mời: Hết hạn [Ngày giờ]  Lượt tối đa [Số nguyên dương]                                |
| [Tạo liên kết]   [Liên kết vừa tạo.......................] [Sao chép]                          |
| {Loại mời} | {Trạng thái} | {Hạn} | {Lượt đã dùng}/{Tối đa}   [Thu hồi]                        |
+------------------------------------------------------------------------------------------------+
```

Dialog report dùng chung (server, tài khoản, tin nhắn, tài liệu, bài, bình luận):

```text
+------------------------------------------------------------------------------------------------+
| Báo cáo vi phạm                                                           [Đóng]               |
| Đối tượng: {Nhãn đối tượng đang chọn}                                                          |
| Lý do      [............................................................]                      |
| Mô tả      [............................................................]                      |
|            [............................................................]                      |
| [Hủy] [Gửi report]                                                                             |
| Sau khi gửi: Đã gửi report.                                                                    |
+------------------------------------------------------------------------------------------------+
```

**Screen Notes:**

- **Route / Quyền:** `/servers/:serverId` · `ServerPage.tsx` — Member còn hiệu lực.
- **UX Goal:** Chat là vùng chính; chỉ mở quản lý khi cần.
- **Data Binding:** `server.id, name, group_image_url`; `server_membership.user_id, role, joined_at, left_at`; `user_account.full_name`; `chat_message.id, sender_user_id, content_text, created_at, edited_at, deleted_at, linked_content_type, linked_content_id, client_request_id`; preview từ `document.title, slug, visibility_status` hoặc `forum_post.title, status`; `react_icon.id, name, icon_image`, count `message_reaction.message_id, icon_id`; `call_session.status`, count participation chưa rời. Owner form dùng `server_invite.invite_type, recipient_user_id, expires_at, max_uses, use_count, status`; report dùng `report.target_type, target_id, reason, description`.
- **Key Interactions:** Menu tin của mình: Sửa/Xóa; tin Member có Gỡ cho Owner; report và reaction có nhãn. Sửa inline có Lưu/Hủy; xóa/gỡ cần xác nhận, gỡ có lý do → `chat_message.deletion_reason`. Đồng bộ tin lưu khi reconnect, dùng request id chống gửi lặp. Owner nâng Member thành Owner; không có hạ quyền tùy ý.
- **Trạng thái / Responsive:** Ảnh nhóm tùy chọn: để trống hoặc tải ảnh lỗi thì dùng chữ đầu suy ra từ `server.name`, giống U01; bỏ URL rồi lưu sẽ dùng fallback này. Drawer đóng mặc định khi hẹp. Mất membership dừng stream/call và về U01. Link nguồn bị gỡ thay preview bằng không còn khả dụng. Rời server cập nhật membership; backend chọn Member tham gia gần nhất nếu không còn Owner.

---

## U03 — Cuộc gọi server

Trong cuộc gọi — lưới người tham gia, panel đóng mặc định:

```text
+---------------------------------------------------------------------------------------------+
| UIT Connect / {Tên server}                                                    [Sáng/tối]    |
|                                                                                             |
| +---------------------------+ +---------------------------+ +---------------------------+   |
| |                           | |                           | |                           |   |
| |       VIDEO / CHỮ ĐẦU     | |       VIDEO / CHỮ ĐẦU     | |       VIDEO / CHỮ ĐẦU     |   |
| |                           | |                           | |                           |   |
| | {Họ tên}        Mic tắt    | | {Họ tên}     Đang nói     | | {Họ tên}        Mic tắt    | |
| +---------------------------+ +---------------------------+ +---------------------------+   |
| +---------------------------+ +---------------------------+ +---------------------------+   |
| |                           | |                           | |                           |   |
| |       VIDEO / CHỮ ĐẦU     | |       VIDEO / CHỮ ĐẦU     | |      XEM TRƯỚC CỦA BẠN   |    |
| |                           | |                           | |                           |   |
| | {Họ tên}        Mic bật    | | {Họ tên}        Mic tắt    | | Bạn             Mic tắt   | |
| +---------------------------+ +---------------------------+ +---------------------------+   |
|                               [Trang trước] {Trang lưới} [Trang sau]                        |
| -----------------------------------------------------------------------------------------   |
| {Tên server}     [Bật mic v] [Tắt camera v] [Chia sẻ]   [Rời cuộc gọi]                      |
|                                                      [Người {Số}/30] [Chat server] [Thêm]   |
+---------------------------------------------------------------------------------------------+
```

Sảnh trước khi tham gia — kiểm tra thiết bị, chưa phát media vào cuộc gọi:

```text
+------------------------------------------------------------------------------------------+
| UIT Connect / {Tên server}                                                    [Sáng/tối] |
|                                                                                          |
| +---------------------------------------------------+   Sẵn sàng tham gia?               |
| |                                                   |   {Tên server}                     |
| |                  CAMERA CỦA BẠN                   |   {Số người} người đang tham gia   |
| |             hoặc chữ đầu tên khi tắt             |                                     |
| |                                                   |   Mic đang tắt. Camera đang bật.   |
| |                                                   |   [Tham gia cuộc gọi]              |
| +---------------------------------------------------+   [Về server]                      |
|        [Bật mic]        [Tắt camera]                                                     |
| Microphone [Thiết bị v]    Camera [Thiết bị v]                                           |
|                                                                                          |
| Chưa có cuộc gọi: Chưa có ai trong cuộc gọi.           [Bắt đầu cuộc gọi]                |
| Không có quyền thiết bị: Cho phép mic/camera trong trình duyệt. [Thử lại]                |
| Bạn vẫn có thể tham gia với mic và camera tắt.                                           |
| Đủ người: Cuộc gọi đã đủ 30 người.                     [Kiểm tra lại] [Về server]        |
+------------------------------------------------------------------------------------------+
```

Khi có người chia sẻ — nội dung lớn, người tham gia ở dải bên phải:

```text
+----------------------------------------------------------------------------------------------+
| UIT Connect / {Tên server}                                                    [Sáng/tối]     |
| {Họ tên} đang chia sẻ                                                                        |
| +--------------------------------------------------------------+ +-----------------------+   |
| |                                                              | | Video / chữ đầu tên   |   |
| |                                                              | | {Họ tên}     Đang nói |   |
| |                                                              | +-----------------------+   |
| |                    NỘI DUNG CHIA SẺ                          | +-----------------------+   |
| |                  Giữ nguyên tỷ lệ nguồn                      | | Video / chữ đầu tên   |   |
| |                                                              | | {Họ tên}      Mic tắt |   |
| |                                                              | +-----------------------+   |
| |                                                              | +-----------------------+   |
| |                                                              | | Bạn           Mic tắt |   |
| +--------------------------------------------------------------+ +-----------------------+   |
|                                                      [Trước] {Trang dải video} [Sau]         |
| -----------------------------------------------------------------------------------------    |
| {Tên server}     [Bật mic v] [Tắt camera v] [Dừng chia sẻ]  [Rời cuộc gọi]                   |
|                                                         [Người {Số}/30] [Chat server] [Thêm] |
+----------------------------------------------------------------------------------------------+
```

Panel bên phải — mở một tab mỗi lần, sân khấu co lại, dock giữ nguyên:

```text
+----------------------------------------------------------------------------------------------+
| +--------------------------------------------------+ +------------------------------------+  |
| |                                                  | | [Người*] [Chat server]      [Đóng] |  |
| |                                                  | | Người tham gia {Số người}/30      |   |
| |              LƯỚI / NỘI DUNG CHIA SẺ             | | {Họ tên} (Bạn)          Mic tắt   |   |
| |                                                  | | {Họ tên} (Điều phối)    Mic bật   |   |
| |                                                  | | {Họ tên}       Mic tắt [Thao tác] |   |
| |                                                  | |                                    |  |
| +--------------------------------------------------+ +------------------------------------+  |
| Dock luôn hiện: [Bật mic] [Tắt camera] [Chia sẻ] [Rời cuộc gọi] [Người] [Chat server] [Thêm] |
|                                                                                              |
| Tab Chat server (thay nội dung tab Người)                                                    |
| +-----------------------------------------------------------------------------------------+  |
| | Chat server                                                                    [Đóng]  |   |
| | Tin nhắn được lưu trong server và mọi thành viên server có thể xem.                      | |
| | {Họ tên} {Thời gian}                                                                    |  |
| | {Nội dung tin nhắn}                                                         [Thao tác]   | |
| | [Tải tin cũ hơn]                                                                        |  |
| | Tin nhắn [................................................................] [Gửi]     |    |
| +-----------------------------------------------------------------------------------------+  |
+----------------------------------------------------------------------------------------------+
```

Mobile — nội dung ưu tiên, nút rời luôn thấy được:

```text
+-------------------------------------------+
| {Tên server}                  [Thêm]      |
| +------------------+ +------------------+ |
| | Video / chữ đầu  | | Video / chữ đầu  | |
| | {Họ tên}         | | {Họ tên}         | |
| | Đang nói         | | Mic tắt          | |
| +------------------+ +------------------+ |
| +------------------+ +------------------+ |
| | Video / chữ đầu  | | Bạn              | |
| | {Họ tên}         | |                  | |
| | Mic tắt          | | Mic tắt          | |
| +------------------+ +------------------+ |
|        [Trước] {Trang} [Sau]              |
| ----------------------------------------- |
| [Bật mic] [Tắt camera] [Rời cuộc gọi]     |
| [Chia sẻ] [Người {Số}/30] [Chat server]   |
+-------------------------------------------+
```

Menu người tham gia và report hành vi — không tạo route riêng:

```text
+-------------------------------------------------------------------------------------------+
| Thao tác với {Họ tên}                                                           [Đóng]    |
| [Báo cáo hành vi]                                                                         |
| Điều phối (chỉ Coordinator đang tham gia)                                                 |
| [Tắt mic người này] [Dừng chia sẻ của người này]                                          |
| ----------------------------------------------------------------------------------------- |
| Báo cáo hành vi cuộc gọi                                                        [Đóng]    |
| Người bị báo cáo [{Họ tên được chọn} v]                                                   |
| Thời điểm        [Ngày giờ.....................]                                          |
| Hành vi / Lý do  [.....................................................................]  |
| Mô tả           [.....................................................................]   |
| [Hủy] [Gửi báo cáo]                                                                       |
| ----------------------------------------------------------------------------------------- |
| Bạn đã rời cuộc gọi.                                     [Tham gia lại] [Về server]       |
| Cuộc gọi đã kết thúc.                                    [Về server]                      |
+-------------------------------------------------------------------------------------------+
```

**Screen Notes:**

- **Route / Quyền:** `/servers/:serverId/call` · `ServerCallPage.tsx` — Member còn hiệu lực; điều phối chỉ Coordinator đang tham gia. Các khung trên là trạng thái thay thế của cùng màn hình.
- **UX Goal:** Thành viên vào đúng server, kiểm tra mic/camera rồi tập trung vào người nói hoặc nội dung trình bày. Mượn cấu trúc Google Meet: sân khấu chiếm phần lớn viewport, lưới video thích ứng, dock cố định phía dưới, people/chat mở theo nhu cầu; giữ nhận diện UIT Connect. Khác biệt có chủ đích là **Chat server** luôn mang tên server và chỉ rõ phạm vi người đọc, vì đây là chat lưu trong server, không phải chat chỉ dành cho người đang gọi.
- **UI/UX Highlights — theme:** Giữ Inter cho title 18/26–600, tên người và control 14/20, metadata 12/16; không đổi sang font hoặc màu Google. Nền `--color-canvas-dark` #1E1F22, tile `--color-surface-dark` #2B2D31, dock/menu `--color-raised-dark` #313338, chữ `--color-text-on-dark` #F2F3F5, focus/active `--color-primary` #5865F2, rời cuộc gọi `--color-danger` #F23F42. Chế độ sáng dùng token sáng có sẵn. Tile radius 16 px, control radius 8 px, gap 16 px desktop/8 px mobile; vùng bấm ít nhất 44 px. Người đang nói có viền primary **và** nhãn “Đang nói”; không đổi vị trí tile liên tục theo giọng nói. Motion theo theme 120–180 ms, tôn trọng reduced-motion.
- **Layout:** U03 dùng call shell thay cho header điều hướng toàn ứng dụng; không có sidebar admin, server rail hoặc breadcrumb nhiều tầng. Header gọn chỉ nhận diện server/theme; dock dành không gian riêng, không đè video. Desktop: context bên trái, mic/camera/share/rời ở giữa, người/chat/thêm bên phải; hình vẽ xuống dòng dock để đọc rõ trong Markdown, không yêu cầu dock hai hàng trên desktop đủ rộng. Menu Thêm chứa Thiết bị, Sáng/tối (mobile), Thông báo và Tài khoản; rời trang khi còn trong call phải có lựa chọn ở lại hoặc rời cuộc gọi, không ngắt media âm thầm. Panel desktop rộng khoảng 320 px và chỉ mở một lần; khi thiếu chiều rộng chuyển thành sheet có nút Đóng. Drawer Thông báo/Tài khoản thay panel hiện tại, không xếp chồng nhiều drawer.
- **Data Binding:** `server.name`; `call_session.id, server_id, coordinator_user_id, status, active_screen_sharer_user_id, started_at, ended_at`; `call_participation.user_id, joined_at, left_at`, count các participation đang hoạt động; `user_account.full_name`. Tên/chữ đầu trên tile lấy từ full_name; self-view xác định bằng user hiện tại. Trạng thái mic/camera, người đang nói, thiết bị, trang lưới và video là runtime media/UI, không thêm trường DB. Lưới minh họa 6 tile, mobile 4 tile; thực tế thích ứng viewport và số người tối đa 30, dùng phân trang khi tile quá nhỏ; số trang suy ra từ participant list và sức chứa lưới. Chat dùng binding U02, không tạo bảng chat cuộc gọi. Điều phối ghi `call_event.actor_user_id, target_user_id, event_type, created_at`.
- **Key Interactions — tham gia:** Trước khi join, mic mặc định tắt; camera chỉ preview khi được cấp quyền và người dùng bật. Nhãn CTA luôn là hành động tiếp theo: “Bật mic” khi đang tắt, “Tắt mic” khi đang bật; camera tương tự. Hình minh họa trạng thái người dùng đã bật preview camera. Nhấn mũi tên cạnh control mở chọn thiết bị, bấm control chính đổi trạng thái; hai hit target tách biệt. Chỉ có một CTA Bắt đầu hoặc Tham gia theo dữ liệu hiện tại. Khi join thành công mới phát track đã chọn vào call. Nếu người khác bắt đầu cùng lúc, backend trả cuộc gọi đang hoạt động để tham gia, không tạo call thứ hai; không biến người join thành Coordinator.
- **Key Interactions — chia sẻ:** Không chia sẻ thì hiển thị lưới; có share thì tự chuyển sang stage + dải video, vẫn thấy self-view. Chia sẻ mở picker của trình duyệt; hủy picker không đổi trạng thái. Chỉ người đang chia sẻ thấy Dừng chia sẻ; người khác thấy Chia sẻ bị vô hiệu cùng lý do “{Họ tên} đang chia sẻ”. Backend xác nhận một sharer duy nhất; nếu có người bắt đầu trước, giữ lưới/stage đúng dữ liệu server và báo ngắn. Dừng từ browser hoặc dock đều đồng bộ về lưới. Không crop tài liệu, không hiện vô hạn bản sao màn hình tự chia sẻ.
- **Key Interactions — điều phối:** Menu người tham gia luôn có Báo cáo hành vi. Chỉ Coordinator đang hiện diện thấy nhóm Điều phối tách biệt; chỉ bật Tắt mic khi mục tiêu đang bật mic, chỉ bật Dừng chia sẻ cho sharer hiện tại. Không có nút bật mic/camera của người khác. Người bị force-mute thấy “Người điều phối đã tắt mic của bạn”; không tự bật lại mic. Coordinator rời không chuyển vai trò; hiển thị “Người điều phối đã rời cuộc gọi” trong panel Người và phục hồi quyền khi chính người đó quay lại.
- **Data Binding — report:** `report.target_type=CALL_BEHAVIOR, reason, description`; ý nghĩa `target_id` theo hợp đồng API vì schema chưa định nghĩa rõ. Người bị report, thời điểm sự việc và hành vi là ngữ cảnh trong `report.description` và `report_evidence.snapshot`; không tự đặt khóa JSON. `report_evidence.captured_at` là lúc ghi bằng chứng, không thay thời điểm sự việc. Form giữ ngữ cảnh người đã chọn nếu họ vừa rời call, không đổi sang người khác. Không có bản ghi âm/video hoặc UI xem lại cuộc gọi.
- **Trạng thái / Recovery:** Chưa có người khác: self-view + “Chưa có ai khác trong cuộc gọi”; không có video trống giả. Thiếu quyền/thiết bị: chỉ rõ mic hay camera có vấn đề, có Thử lại và cho join tắt cả hai. Reconnect hiện banner “Đang kết nối lại...” và giữ mic/camera theo lựa chọn trước đó; lỗi kéo dài có Kết nối lại/Rời cuộc gọi. Bị thu hồi membership thì dừng track, xóa nội dung riêng và về U01. Rời cuộc gọi là hành động tức thì, không hộp xác nhận thường lệ; dừng toàn bộ local track, không kết thúc call của người khác. Sau rời có Tham gia lại nếu call còn hoạt động và còn quyền/chỗ; call kết thúc khi người cuối rời. Đủ 30 người thì không cho join; kiểm tra lại không tự động tham gia.
- **Responsive / Accessibility:** Mobile chỉ giữ tối đa 2 cột tile; khi chia sẻ dùng stage phía trên và dải người bên dưới; sheet người/chat mở trên vùng stage, dock vẫn thao tác được. Chia sẻ trên trình duyệt không hỗ trợ được vô hiệu với lý do, người dùng vẫn xem được share. Giữ nút mic/camera/rời ngoài overflow, có safe-area/padding bàn phím và cuộn composer vào tầm nhìn. Nút có tên truy cập diễn tả hành động, trạng thái mic/camera đọc được ngoài màu sắc; focus không mất khi tile đổi trang hoặc participant rời. Bàn phím mở/đóng panel, Escape trả focus về trigger. Tên dài rút gọn thị giác nhưng giữ tên đầy đủ cho công nghệ hỗ trợ; không announce liên tục mỗi lần đổi người nói.
- **Tham chiếu bố cục:** [Google Meet — layout trên máy tính](https://support.google.com/meet/answer/10550593?hl=en), [Google Meet — lưới người tham gia](https://support.google.com/meet/answer/9292748?hl=en). Chỉ dùng các pattern stage/grid/dock/panel; không thêm phụ đề, giơ tay, phòng chờ duyệt vào, hiệu ứng nền hay recording chưa có trong yêu cầu hệ thống.

---

## U04 — Kho tài liệu

```text
+--------------------------------------------------------------------------------------------------+
| UIT Connect | Server | Tài liệu* | Diễn đàn                  [Thông báo] [Sáng/tối] [Tài khoản]  |
| Kho tài liệu                                                        [Nội dung của tôi] [Tải lên] |
| Tìm tài liệu [Tiêu đề, tag, collection hoặc nội dung.......................] [Tìm]               |
| Collection [Tất cả v]  Category [Tất cả v]  [Xóa bộ lọc]                                         |
| +------------------------------+------------------------------+-------------------------------+  |
| | {Tiêu đề}                    | {Tiêu đề}                    | {Tiêu đề}                     |  |
| | {Collection}                 | {Collection}                 | {Collection}                  |  |
| | [{Tag}] [{Tag}]              | [{Tag}] [{Tag}]              | [{Tag}] [{Tag}]               |  |
| | {Tên tệp} | {Kích thước}     | {Tên tệp} | {Kích thước}     | {Tên tệp} | {Kích thước}      |  |
| | [Xem tài liệu]               | [Xem tài liệu]               | [Xem tài liệu]                |  |
| +------------------------------+------------------------------+-------------------------------+  |
|                                         [Tải thêm]                                               |
+--------------------------------------------------------------------------------------------------+
```

**Screen Notes:**

- **Route / Quyền:** `/documents` · `DocumentLibraryPage.tsx` — User.
- **UX Goal:** Tìm theo nhiều loại dữ liệu bằng một ô tìm kiếm.
- **Data Binding:** `document.title, tags, slug, visibility_status=PUBLIC`; submission APPROVED; `media.file_name, size_bytes`; `document_collection.collection_id` → `collection.name`; `document_category.category_id` → `category.name`; tìm OCR qua `agent_classification.ocr_text` thuộc submission được phép công khai.
- **Key Interactions:** Search/filter kết hợp; clear bỏ truy vấn/lọc; card → U05; upload → U06; nội dung của tôi → U07. Không đưa OCR/tệp từ lần nộp bị từ chối vào kết quả công khai.
- **Trạng thái / Responsive:** Grid 3/2/1; loading skeleton giữ kích thước; rỗng do lọc có Xóa bộ lọc, kho rỗng có Tải lên.

---

## U05 — Chi tiết tài liệu

```text
+-------------------------------------------------------------------------------------------------+
| UIT Connect | Server | Tài liệu* | Diễn đàn                  [Thông báo] [Sáng/tối] [Tài khoản] |
| Kho tài liệu > {Tiêu đề}                                                                        |
| {Tiêu đề}                                                                                       |
| +------------------------------------------------------------+--------------------------------+ |
| |                                                            | {Collection}                   | |
| |                  XEM TRƯỚC TÀI LIỆU                       | Category: {Tên category}       |  |
| |                                                            | [{Tag}] [{Tag}]                | |
| |                                                            | Người tải: {Họ tên}            | |
| |                                                            | {Ngày tạo}                     | |
| |                                                            | {Tên tệp} | {Loại} | {Cỡ}      | |
| |                                                            | [Tải tài liệu]                 | |
| |                                                            | [Chia sẻ vào server]           | |
| |                                                            | [Report tài liệu]              | |
| +------------------------------------------------------------+--------------------------------+ |
| Mô tả                                                                                           |
| {Mô tả tài liệu}                                                                                |
+-------------------------------------------------------------------------------------------------+
```

Dialog chia sẻ dùng chung cho tài liệu và bài viết:

```text
+------------------------------------------------------------------------------------------------+
| Chia sẻ vào server                                                        [Đóng]               |
| {Tiêu đề tài liệu / bài viết}                                                                  |
| Server [Chọn trong server đã tham gia v]                                                       |
| Lời nhắn (tùy chọn) [...................................................]                      |
| [Hủy] [Chia sẻ]                                                                                |
| Chưa tham gia server nào.                                   [Về server của tôi]                |
+------------------------------------------------------------------------------------------------+
```

**Screen Notes:**

- **Route / Quyền:** `/documents/:slug` · `DocumentDetailPage.tsx` — User; chỉ tài liệu PUBLIC.
- **UX Goal:** Đọc trước, xem nguồn và hành động rõ ràng.
- **Data Binding:** `document.id, title, description, tags, slug, uploaded_by_user_id, created_at, media_id, visibility_status`; `user_account.full_name`; `media.file_name, mime_type, size_bytes, status`; collection/category qua các bảng liên kết U04. Chia sẻ tạo `chat_message.server_id, sender_user_id, content_text, linked_content_type=DOCUMENT, linked_content_id`; server chọn qua membership còn hiệu lực.
- **Key Interactions:** Tải/preview lấy URL có thời hạn từ backend, không lộ object key. Share chọn server đã tham gia rồi xác nhận; Report mở dialog U02. Nguồn vẫn là tài liệu công khai.
- **Trạng thái / Responsive:** Không preview được: hiện tên/loại tệp và Tải tài liệu nếu được phép. URL hết hạn: cấp lại khi quyền còn hợp lệ; REMOVED/HIDDEN thay toàn vùng bằng không khả dụng, tắt tải/share. Mobile rail xếp dưới title.

---

## U06 — Nộp và gửi lại tài liệu

```text
+--------------------------------------------------------------------------------------------------+
| UIT Connect | Server | Tài liệu* | Diễn đàn                  [Thông báo] [Sáng/tối] [Tài khoản]  |
| Nội dung của tôi > Nộp tài liệu                                                                  |
| Nộp tài liệu                                                                                     |
| [1. Tệp và thông tin*] ---------------- [2. Kiểm tra]                                            |
| +--------------------------------------------------------------------------------------------+   |
| | Kéo tệp vào đây hoặc [Chọn tệp]                                                             |  |
| | {Tên tệp} | {Loại tệp} | {Kích thước}                                 [Chọn lại]             | |
| | Tiêu đề [...............................................................................]  |   |
| | Mô tả   [...............................................................................]  |   |
| | Tag     [{Tag} x] [{Tag} x] [Nhập tag...................]                                   |  |
| +--------------------------------------------------------------------------------------------+   |
| [Quay lại]                                                                         [Kiểm tra]    |
| Sau gửi: [Đang xử lý] / [Chờ duyệt]                                      [Xem nội dung của tôi]  |
+--------------------------------------------------------------------------------------------------+
```

Biến thể gửi lại và bước kiểm tra:

```text
+------------------------------------------------------------------------------------------------+
| Gửi lại tài liệu                                                                               |
| Lần nộp trước bị từ chối: {Lý do từ chối}                                                      |
| [Tệp và thông tin chỉnh sửa như form trên]                                                     |
| -----------------------------------------------------------------------                        |
| [1. Tệp và thông tin] ---------------- [2. Kiểm tra*]                                          |
| Kiểm tra trước khi gửi                                                                         |
| {Tiêu đề} | {Tên tệp} | {Kích thước}                                                           |
| {Mô tả} | {Danh sách tag}                                                                      |
| Tài liệu sẽ được xử lý và chờ duyệt.                                                           |
| [Sửa thông tin] [Gửi duyệt]                                                                    |
| Đang tải tệp: [==============              ] {Phần trăm truyền tệp}                            |
+------------------------------------------------------------------------------------------------+
```

**Screen Notes:**

- **Route / Quyền:** `/documents/new`, `/documents/:id/resubmit` · `DocumentSubmissionPage.tsx` — User; gửi lại tài liệu của mình bị từ chối.
- **UX Goal:** Một form nhập tệp và thông tin, sau đó một bước kiểm tra trước khi gửi.
- **Data Binding:** `media.file_name, mime_type, size_bytes, status`; `document.title, description, tags, media_id, uploaded_by_user_id`; `document_submission.document_id, submitted_by_user_id, submitted_at, status, rejection_reason`. Progress upload là số byte truyền tạm thời.
- **Key Interactions:** Bước 1 gộp chọn tệp và nhập title/description/tags. Nút Kiểm tra mở bước 2 chỉ đọc với đúng tệp/thông tin đã nhập; Sửa thông tin quay lại bước 1 và giữ toàn bộ dữ liệu. Chỉ Gửi duyệt ở bước 2 mới nộp tài liệu; dùng cùng hai bước khi gửi lại. Tệp phải qua kiểm tra backend; không tự đặt danh sách định dạng/kích thước chưa được đặc tả. Gửi lại tạo document_submission mới, giữ lịch sử lần cũ.
- **Trạng thái / Responsive:** Resubmit hiện lý do trước form; SCANNING/QUARANTINED có trạng thái chờ; media REJECTED chỉ cho chọn lại. Lỗi upload giữ metadata, cho Thử lại; không giả lập phần trăm OCR.

---

## U07 — Nội dung của tôi

```text
+--------------------------------------------------------------------------------------------------+
| UIT Connect | Server | Tài liệu | Diễn đàn                   [Thông báo] [Sáng/tối] [Tài khoản]  |
| Nội dung của tôi                                                                                 |
| [Tài liệu*] [Bài viết]                             Trạng thái [Tất cả v] [Xóa bộ lọc]            |
| +---------------------------------+-------------------+-------------------+-------------------+  |
| | Tiêu đề                         | Trạng thái        | Lần nộp           | Thao tác          |  |
| +---------------------------------+-------------------+-------------------+-------------------+  |
| | {Tiêu đề}                       | Đang xử lý        | {Ngày nộp}        | [Lịch sử]         |  |
| | {Tiêu đề}                       | Chờ duyệt         | {Ngày nộp}        | [Lịch sử]         |  |
| | {Tiêu đề}                       | Từ chối           | {Ngày nộp}        | [Gửi lại]         |  |
| | Lý do: {Lý do từ chối}           |                   |                   | [Lịch sử]         | |
| | {Tiêu đề}                       | Đã duyệt          | {Ngày nộp}        | [Xem tài liệu]    |  |
| | {Tiêu đề}                       | Đã gỡ             | {Ngày nộp}        | [Lịch sử]         |  |
| | Lý do gỡ: {Lý do gỡ tài liệu}                                                             |    |
| +---------------------------------+-------------------+-------------------+-------------------+  |
| [Tải thêm]                                                                       [Tải tài liệu]  |
| Tab Bài viết                                                                                     |
| {Tiêu đề} | {Trạng thái} | {Ngày cập nhật}                           [Xem] [Sửa và gửi duyệt]    |
| Lý do: {Lý do kiểm duyệt nếu có}                                                 [Viết bài]      |
+--------------------------------------------------------------------------------------------------+
```

Drawer lịch sử tài liệu:

```text
+------------------------------------------------------------------------------------------------+
| Lịch sử nộp: {Tiêu đề}                                                    [Đóng]               |
| {Ngày nộp} -> {Trạng thái} -> {Ngày duyệt nếu có}                                              |
| Lý do: {rejection_reason nếu có}                                                               |
| -----------------------------------------------------------------------                        |
| {Ngày nộp trước} -> {Trạng thái} -> {Ngày duyệt nếu có}                                        |
| Lý do: {rejection_reason nếu có}                                                               |
+------------------------------------------------------------------------------------------------+
```

**Screen Notes:**

- **Route / Quyền:** `/my-content` · `MyContentPage.tsx` — User; dữ liệu của chính mình.
- **UX Goal:** Theo dõi trạng thái và lý do, biết ngay việc có thể làm tiếp.
- **Data Binding:** Tài liệu của `document.uploaded_by_user_id`: `title, visibility_status, removal_reason`; `document_submission.id, status, submitted_at, reviewed_at, rejection_reason`. Bài của `forum_post.author_user_id`: `id, title, status, updated_at, moderation_reason`.
- **Key Interactions:** History drawer liệt kê từng submission theo thời điểm và kết quả; gửi lại → U06; sửa bài → U10. Tài liệu APPROVED và PUBLIC có Xem tài liệu → U05. Tài liệu REMOVED có hàng riêng: Đã gỡ, lý do từ `document.removal_reason` và Lịch sử; không có xem/tải công khai hoặc gửi lại khi chưa có quy tắc. Nếu lý do chưa có, hiển thị “Chưa có lý do gỡ” thay vì bỏ trống.
- **Trạng thái / Responsive:** Tab tài liệu phân biệt submission status và visibility; Xem tài liệu chỉ hiện khi APPROVED và PUBLIC; trạng thái Đã gỡ được ưu tiên khi visibility là REMOVED dù lần nộp trước đó APPROVED. Bài chưa duyệt mở preview riêng của tác giả, không route đọc công khai; không dựng lịch sử phiên bản bài vì schema không có. Mobile dùng card với lý do hiện sẵn.

---

## U08 — Diễn đàn

```text
+-----------------------------------------------------------------------------------------------------+
| UIT Connect | Server | Tài liệu | Diễn đàn*                  [Thông báo] [Sáng/tối] [Tài khoản]     |
| Diễn đàn                                                          [Nội dung của tôi] [Viết bài]     |
| Tìm bài viết [.................................................................] [Tìm]              |
| Chủ đề [{Chủ đề} x] [{Chủ đề} x] [Thêm chủ đề v]                               [Xóa bộ lọc]         |
| +--------------------------------------------------------------------------------------------+      |
| | {Họ tên / Bí danh trong bài}                                                 {Ngày đăng}     |    |
| | {Tiêu đề}                                                                                  |      |
| | {Đoạn trích nội dung}                                                                      |      |
| | [{Chủ đề}] [{Chủ đề}]                                                                      |      |
| | Like {Số lượt}   Dislike {Số lượt}   Bình luận {Số bình luận hiển thị}          [Đọc bài]       | |
| +--------------------------------------------------------------------------------------------+      |
| +--------------------------------------------------------------------------------------------+      |
| | {Họ tên / Bí danh trong bài}                                                 {Ngày đăng}     |    |
| | {Tiêu đề}                                                                                  |      |
| | {Đoạn trích nội dung}                                                      [Đọc bài]        |     |
| +--------------------------------------------------------------------------------------------+      |
|                                         [Tải thêm]                                                  |
+-----------------------------------------------------------------------------------------------------+
```

**Screen Notes:**

- **Route / Quyền:** `/forum` · `ForumFeedPage.tsx` — User.
- **UX Goal:** Feed dễ đọc, hỗ trợ nhiều chủ đề tự do.
- **Data Binding:** `forum_post.id, title, content, topics, is_anonymous, author_user_id, created_at, status=APPROVED, deleted_at`; public author là `user_account.full_name` hoặc `anonymous_alias.display_alias`; tổng `post_reaction.reaction`, count `comment.status=VISIBLE` theo post.
- **Key Interactions:** Tìm bài/lọc một hoặc nhiều topics; không danh mục chủ đề bắt buộc. Đọc → U09; viết → U10. Đoạn trích được render an toàn từ content JSON; không lộ author_user_id khi ẩn danh.
- **Trạng thái / Responsive:** Feed rỗng cho Viết bài; lọc rỗng cho Xóa bộ lọc. Mobile một cột, chip wrap, giữ CTA đọc rõ ràng.

---

## U09 — Bài viết và bình luận

```text
+--------------------------------------------------------------------------------------------------+
| UIT Connect | Server | Tài liệu | Diễn đàn*                  [Thông báo] [Sáng/tối] [Tài khoản]  |
| Diễn đàn > {Tiêu đề}                                                                             |
| +------------------------------------------------------------+--------------------------------+  |
| | {Tiêu đề}                                                 | [{Chủ đề}] [{Chủ đề}]           |  |
| | {Họ tên / Bí danh} {Ngày đăng}                             | [Chia sẻ vào server]           |  |
| |                                                            | [Report bài viết]              |  |
| | {Nội dung bài viết}                                       | [Sửa bài: chỉ tác giả]         |   |
| |                                                            |                                |  |
| | [Like {Số}] [Dislike {Số}]                                 |                                |  |
| |------------------------------------------------------------|                                |  |
| | Bình luận                                                 |                                |   |
| | {Họ tên / Bí danh} {Thời gian}                             |                                |  |
| | {Nội dung bình luận}                                      |                                |   |
| | [Like {Số}] [Dislike {Số}] [Trả lời] [Report]               |                                | |
| |   Trả lời {Tên hiển thị cha}: {Tên hiển thị} {Thời gian}    |                                | |
| |   {Nội dung trả lời} [Trả lời] [Report]                    |                                |  |
| |------------------------------------------------------------|                                |  |
| | Bình luận [............................................]  |                                |   |
| | [ ] Đăng ẩn danh                               [Gửi]       |                                |  |
| | Tên thật được ẩn với người dùng khác.                      |                                |  |
| | Quản trị viên có quyền vẫn có thể xem danh tính            |                                |  |
| | để kiểm duyệt; lần truy cập được ghi nhật ký.              |                                |  |
| +------------------------------------------------------------+--------------------------------+  |
+--------------------------------------------------------------------------------------------------+
```

**Screen Notes:**

- **Route / Quyền:** `/forum/:postId` · `ForumPostPage.tsx` — User; bài APPROVED cho đọc/bình luận công khai.
- **UX Goal:** Giữ mạch đọc và trả lời, bảo vệ danh tính ẩn danh.
- **Data Binding:** `forum_post.title, content, topics, status, is_anonymous, author_user_id, created_at`; `comment.id, parent_id, forum_post_id, content, is_anonymous, status, author_user_id, created_at`; `anonymous_alias.forum_post_id, display_alias`; count/current selection từ `post_reaction.reaction`, `comment_reaction.reaction`. Share binding U05 với `linked_content_type=FORUM_POST`.
- **Key Interactions:** Trả lời gắn parent_id, hiện “Đang trả lời {tên}” và Hủy trong composer. Like/Dislike loại trừ theo một row mỗi user/đối tượng. Report dùng U02; share U05. Giải thích phạm vi ẩn danh ngay dưới toggle, luôn thấy trước khi gửi bình luận hoặc trả lời; gắn mô tả với checkbox để công nghệ hỗ trợ đọc được. Ẩn danh giữ alias trong bài, không link profile hoặc liên kết danh tính giữa các bài.
- **Trạng thái / Responsive:** Thread sâu vẫn giữ cha tham chiếu, giới hạn thụt lề thị giác; comment REMOVED dùng tombstone. Bài trở lại pending/bị gỡ khóa đọc công khai và composer. Desktop cột đọc 760 px; mobile action rail dưới title.

---

## U10 — Soạn và sửa bài viết

```text
+----------------------------------------------------------------------------------------------------+
| UIT Connect | Server | Tài liệu | Diễn đàn*                  [Thông báo] [Sáng/tối] [Tài khoản]    |
| Diễn đàn > Viết bài                                                                                |
| Viết bài / Sửa bài                                                                                 |
| Tiêu đề [...................................................................................]      |
| Nội dung                                                                                           |
| +--------------------------------------------------------------------------------------------+     |
| | [Đậm] [Nghiêng] [Danh sách] [Liên kết]                                                       |   |
| |                                                                                            |     |
| | {Nội dung đang soạn}                                                                       |     |
| |                                                                                            |     |
| +--------------------------------------------------------------------------------------------+     |
| Chủ đề [{Chủ đề} x] [{Chủ đề} x] [Nhập chủ đề tự do......................]                         |
| [ ] Đăng ẩn danh                                                                                   |
| Bí danh chỉ dùng trong bài này; tên thật được ẩn với người dùng khác.                              |
| Quản trị viên có quyền vẫn có thể xem danh tính để kiểm duyệt;                                     |
| lần truy cập được ghi nhật ký.                                                                     |
| Bài viết sẽ được gửi duyệt.                                          [Hủy] [Xem trước] [Gửi duyệt] |
+----------------------------------------------------------------------------------------------------+
```

Khi sửa bài đã công khai — thay thông báo và CTA ở cả editor lẫn preview:

```text
+------------------------------------------------------------------------------------------+
| Sau khi lưu, bài viết sẽ tạm ẩn khỏi cộng đồng cho đến khi được duyệt lại.               |
| [Tiếp tục sửa] [Lưu và gửi duyệt]                                                        |
+------------------------------------------------------------------------------------------+
```

Preview và xác nhận rời editor:

```text
+------------------------------------------------------------------------------------------------+
| Xem trước                                                                [Đóng]                |
| {Tiêu đề} | [{Chủ đề}]                                                                         |
| {Nội dung đã định dạng}                                                                        |
| [Quay lại sửa] [Gửi duyệt]                                                                     |
| -----------------------------------------------------------------------                        |
| Bỏ thay đổi chưa gửi? Các thay đổi này chưa được lưu.                                          |
| [Tiếp tục sửa] [Bỏ thay đổi]                                                                   |
+------------------------------------------------------------------------------------------------+
```

**Screen Notes:**

- **Route / Quyền:** `/forum/new`, `/forum/:postId/edit` · `ForumPostEditorPage.tsx` — User; chỉ tác giả được sửa.
- **UX Goal:** Soạn tập trung với trạng thái sẽ gửi duyệt rõ ràng.
- **Data Binding:** `forum_post.title, content` (JSON), `topics, is_anonymous, status=PENDING_REVIEW, author_user_id, updated_at`; alias do hệ thống tạo trong `anonymous_alias`.
- **Key Interactions:** Xem trước dùng dữ liệu form, không xuất bản. Giải thích phạm vi ẩn danh ngay dưới toggle, gắn mô tả với checkbox và giữ hiển thị trên mobile. Với bài đang công khai, editor và preview đều hiển thị cảnh báo tạm ẩn ngay trước CTA Lưu và gửi duyệt; chỉ sau khi lưu thành công bài mới quay lại PENDING_REVIEW và mất hiển thị công khai. Preview dùng Tiếp tục sửa để quay lại form; editor giữ Hủy/Xem trước bên cạnh CTA lưu. Sau thành công thông báo “Đã gửi duyệt lại. Bài viết đang tạm ẩn.” rồi mở U07; lưu lỗi giữ nội dung và không giả lập đổi trạng thái. Không tạo lưu nháp server vì schema không có DRAFT; bản chưa gửi chỉ tồn tại trong form.
- **Trạng thái / Responsive:** Lỗi giữ nội dung; rời khi có sửa chưa gửi có xác nhận. Tác giả không còn quyền thì dừng lưu. Mobile toolbar wrap, CTA không che phần đang gõ.

---

## M01 — Tổng quan quản trị

```text
+--------------------------------------------------------------------------------------------------------+
| UIT Connect | Quản trị                                [Về ứng dụng] [Thông báo] [Sáng/tối] [Tài khoản] |
| | Tổng quan       |  Tổng quan                                                                         |
| | Report          |  +-----------------------+------------------------+-----------------------+        |
| | Tài khoản       |  | Report đang mở        | Tài liệu chờ duyệt     | Bài viết chờ duyệt     |       |
| | Server          |  | {Số OPEN}             | {Số PENDING_REVIEW}    | {Số PENDING_REVIEW}    |       |
| | Tài liệu        |  | [Xử lý report]        | [Duyệt tài liệu]       | [Duyệt bài viết]       |       |
| | Phân loại       |  +-----------------------+------------------------+-----------------------+        |
| | Diễn đàn        |  Report đang xử lý: {Số IN_REVIEW}                             [Mở hàng đợi]       |
| | Audit log       |  Tài liệu đang xử lý: {Số PENDING_PROCESSING}                    [Mở hàng đợi]     |
+--------------------------------------------------------------------------------------------------------+
```

**Screen Notes:**

- **Route / Quyền:** `/admin` · `AdminOverviewPage.tsx` — Admin.
- **UX Goal:** Tổng quan việc cần xử lý, không thêm chỉ số tăng trưởng.
- **Data Binding:** Count `report.id` theo `status=OPEN/IN_REVIEW`; count `document_submission.id` theo `PENDING_REVIEW/PENDING_PROCESSING`; count `forum_post.id` theo `PENDING_REVIEW`.
- **Key Interactions:** Card mở M02/M06/M09 với bộ lọc tương ứng. Count submission là lần nộp, không gọi là tổng số tài liệu độc lập. Sidebar dùng chung cho M01–M10.
- **Trạng thái / Responsive:** Mỗi count có loading/error riêng; số 0 hợp lệ và vẫn có lối mở queue. Mobile cards xếp dọc; sidebar drawer.

---

## M02 — Danh sách report

```text
+--------------------------------------------------------------------------------------------------------+
| UIT Connect | Quản trị                                [Về ứng dụng] [Thông báo] [Sáng/tối] [Tài khoản] |
| | Tổng quan       |  Quản trị > Report                                                                 |
| | Report          |  Report                                                                            |
| | Tài khoản       |  Trạng thái [Tất cả v]  Phụ trách [Tất cả v]                                       |
| | Server          |  Loại đối tượng [Tất cả v] [Xóa bộ lọc]                                            |
| | Tài liệu        |  +----------+----------------+-------------+---------------+--------------+        |
| | Phân loại       |  | Report   | Đối tượng      | Trạng thái  | Phụ trách     | Ngày tạo     |        |
| | Diễn đàn        |  +----------+----------------+-------------+---------------+--------------+        |
| | Audit log       |  | {ID}     | {Loại} {ID}    | {Trạng thái}| {Họ tên / --} | {Thời gian}  |        |
| |                 |  | [Mở]     |                |             |               |              |        |
| |                 |  +----------+----------------+-------------+---------------+--------------+        |
| |                 |  [Trước] [Tiếp]                                                                    |
+--------------------------------------------------------------------------------------------------------+
```

**Screen Notes:**

- **Route / Quyền:** `/admin/reports` · `AdminReportsPage.tsx` — Admin.
- **UX Goal:** Triage theo trạng thái và phạm vi đối tượng.
- **Data Binding:** `report.id, target_type, target_id, status, assigned_admin_id, created_at`; phụ trách join `user_account.full_name` với tài khoản admin. Filter target_type dùng đúng bảy ReportTargetType trong schema.
- **Key Interactions:** Mở row → M03; chọn trạng thái OPEN/IN_REVIEW/RESOLVED/DISMISSED. Không preview chat riêng hoặc danh tính ẩn danh trong bảng.
- **Trạng thái / Responsive:** Chưa phân công hiển thị “Chưa phân công”; filter rỗng có clear. Mobile card giữ type/id/status/assignee/time và nút Mở.

---

## M03 — Chi tiết và xử lý report

```text
+--------------------------------------------------------------------------------------------------------+
| UIT Connect | Quản trị                                [Về ứng dụng] [Thông báo] [Sáng/tối] [Tài khoản] |
| | Tổng quan       |  Report > {ID report}                                                              |
| | Report          |  Report {ID}                                                   {Trạng thái}        |
| | Tài khoản       |  +----------------------------------------+----------------------------------+     |
| | Server          |  | Đối tượng: {Loại} {ID}                 | Phân công [Admin v] [Lưu]         |    |
| | Tài liệu        |  | Người gửi: {Họ tên} | {Ngày tạo}       | Trạng thái: {Trạng thái}          |    |
| | Phân loại       |  | Lý do: {Lý do}                         | [Bắt đầu xử lý]                   |    |
| | Diễn đàn        |  | Mô tả: {Mô tả}                         | Kết luận                         |     |
| | Audit log       |  |----------------------------------------| [..............................] |     |
| |                 |  | Bằng chứng: {Thời điểm ghi nhận}       | [Giải quyết] [Bác bỏ]             |    |
| |                 |  | {Snapshot được phép hiển thị}          |                                  |     |
| |                 |  | Nội dung nhạy cảm: Đã ẩn               | [Mở tác vụ xử lý liên quan]       |    |
| |                 |  | [Xem dữ liệu liên quan]                |                                  |     |
| |                 |  +----------------------------------------+----------------------------------+     |
+--------------------------------------------------------------------------------------------------------+
```

Dialog truy cập nhạy cảm dùng tại M03 và M09:

```text
+------------------------------------------------------------------------------------------------+
| Xem dữ liệu liên quan                                                     [Đóng]               |
| Phạm vi: {Đối tượng và phần dữ liệu được phép cho report / kiểm duyệt này}                     |
| Mục đích [..............................................................]                      |
| Lần truy cập này được ghi nhật ký.                                                             |
| [Hủy] [Xem dữ liệu liên quan]                                                                  |
| -----------------------------------------------------------------------                        |
| Sau xác nhận thành công: {Nội dung thuộc đúng phạm vi được cấp}                                |
| [Đóng dữ liệu nhạy cảm]                                                                        |
+------------------------------------------------------------------------------------------------+
```

**Screen Notes:**

- **Route / Quyền:** `/admin/reports/:reportId` · `AdminReportDetailPage.tsx` — Admin.
- **UX Goal:** Đọc bằng chứng và quyết định cạnh nhau, giữ cổng truy cập nhạy cảm.
- **Data Binding:** `report.id, target_type, target_id, reported_by_user_id, reason, description, status, assigned_admin_id, resolved_by_admin_id, resolution, created_at, resolved_at`; `report_evidence.report_id, source_type, snapshot, captured_at, purge_at`. Gate ghi `audit_log.actor_admin_id, action, target_type, target_id, report_id, purpose, occurred_at`.
- **Key Interactions:** OPEN → IN_REVIEW → RESOLVED/DISMISSED; lưu assignee độc lập, không tự kết luận. Mở tác vụ liên quan → M04/M05/M07/M09 theo loại. Snapshot chỉ đọc, không cập nhật theo nguồn. Gate áp dụng cả snapshot chứa chat/identity nhạy cảm.
- **Trạng thái / Responsive:** Evidence hết retention: báo không còn bằng chứng, không phục dựng nguồn. Report kết thúc hiển thị resolution/người xử lý/thời gian read-only. Mobile evidence trước decision panel; sticky không che nội dung.

---

## M04 — Quản lý tài khoản

```text
+--------------------------------------------------------------------------------------------------------+
| UIT Connect | Quản trị                                [Về ứng dụng] [Thông báo] [Sáng/tối] [Tài khoản] |
| | Tổng quan       |  Quản trị > Tài khoản                                                              |
| | Report          |  Tài khoản                                                                         |
| | Tài khoản       |  Tìm họ tên / email [........................................] [Tìm]               |
| | Server          |  Trạng thái [Tất cả v]  Loại [Tất cả v] [Xóa bộ lọc]                               |
| | Tài liệu        |  +----------------+--------------------+-----------+-------------+-----------+     |
| | Phân loại       |  | Họ tên         | Email              | Loại      | Trạng thái  | Thao tác  |     |
| | Diễn đàn        |  +----------------+--------------------+-----------+-------------+-----------+     |
| | Audit log       |  | {Họ tên}       | {Email}            | {Loại}    | {Trạng thái}| [Mở]      |     |
| |                 |  +----------------+--------------------+-----------+-------------+-----------+     |
| |                 |  [Trước] [Tiếp]                                                                    |
+--------------------------------------------------------------------------------------------------------+
```

Drawer tài khoản và xác nhận:

```text
+------------------------------------------------------------------------------------------------+
| {Họ tên}                                                                 [Đóng]                |
| Email: {Email} | Loại: {Loại} | Trạng thái: {Trạng thái}                                       |
| Ngày tạo: {Ngày tạo} | Xác thực email: {Ngày xác thực / Chưa xác thực}                         |
| [Khóa / Gỡ khóa khi được phép] [Gửi thông báo]                                                 |
| -----------------------------------------------------------------------                        |
| Khóa tài khoản {Email}?                                                                        |
| Tài khoản sẽ không thể đăng nhập hoặc sử dụng hệ thống.                                        |
| Lý do [.................................................................]                      |
| [Hủy] [Khóa tài khoản]                                                                         |
| -----------------------------------------------------------------------                        |
| Gỡ khóa {Email}? Trạng thái sau xử lý: {ACTIVE / UNVERIFIED theo xác thực}.                    |
| Lý do [.................................................................]                      |
| [Hủy] [Gỡ khóa]                                                                                |
| -----------------------------------------------------------------------                        |
| Gửi thông báo đến {Họ tên}                                                                     |
| Nội dung [..............................................................]                      |
| [Hủy] [Gửi thông báo]                                                                          |
+------------------------------------------------------------------------------------------------+
```

**Screen Notes:**

- **Route / Quyền:** `/admin/accounts` · `AdminAccountsPage.tsx` — Admin.
- **UX Goal:** Xử lý tài khoản với phạm vi và hậu quả nhìn thấy được.
- **Data Binding:** `user_account.id, full_name, email, account_type, account_status, email_verified_at, created_at`; khóa/gỡ khóa sửa `account_status`; lý do thao tác vào `audit_log.purpose`, không có user.ban_reason. Gửi thông báo: `notification.recipient_user_id, actor_user_id, kind=ADMIN_MESSAGE, content, created_at`.
- **Key Interactions:** Drawer xem chi tiết, khóa/gỡ khóa tài khoản cá nhân theo quy tắc; unban về ACTIVE nếu đã xác thực, ngược lại UNVERIFIED. Không suy ra quyền đổi vai trò hay quy trình khóa UIT từ quy tắc tài khoản cá nhân. Gửi thông báo một chiều, không mở DM.
- **Trạng thái / Responsive:** Hành động khóa cần xác nhận target/lý do; chưa backend xác nhận không đổi badge. Không hiển thị hash/token. Mobile table thành cards.

---

## M05 — Quản lý server

```text
+--------------------------------------------------------------------------------------------------------+
| UIT Connect | Quản trị                                [Về ứng dụng] [Thông báo] [Sáng/tối] [Tài khoản] |
| | Tổng quan       |  Quản trị > Server                                                                 |
| | Report          |  Server                                                                            |
| | Tài khoản       |  Tên server [.................................................] [Tìm]              |
| | Server          |  +-----------------------+----------------------+----------------+-----------+     |
| | Tài liệu        |  | Server                | Người tạo            | Ngày tạo       | Thao tác  |     |
| | Phân loại       |  +-----------------------+----------------------+----------------+-----------+     |
| | Diễn đàn        |  | [Ảnh] {Tên server}    | {Họ tên}             | {Ngày tạo}     | [Mở]      |     |
| | Audit log       |  +-----------------------+----------------------+----------------+-----------+     |
| |                 |  [Trước] [Tiếp]                                                                    |
+--------------------------------------------------------------------------------------------------------+
```

Drawer và xác nhận hủy:

```text
+------------------------------------------------------------------------------------------------+
| {Tên server}                                                             [Đóng]                |
| Người tạo: {Họ tên} | Ngày tạo: {Ngày tạo}                                                     |
| Thành viên                                                                                     |
| {Họ tên} | {Vai trò} | {Ngày tham gia}                             [Kick]                      |
| Mời người dùng [Tìm email / chọn tài khoản v]                [Gửi lời mời]                     |
| [Hủy server]                                                                                   |
| -----------------------------------------------------------------------                        |
| Kick {Họ tên} khỏi {Tên server}?                                                               |
| Lý do [.................................................................]                      |
| [Hủy] [Kick]                                                                                   |
| -----------------------------------------------------------------------                        |
| Hủy server {Tên server}?                                                                       |
| Thành viên sẽ mất quyền truy cập server này.                                                   |
| Lý do [.................................................................]                      |
| [Quay lại] [Xác nhận hủy server]                                                               |
+------------------------------------------------------------------------------------------------+
```

**Screen Notes:**

- **Route / Quyền:** `/admin/servers` · `AdminServersPage.tsx` — Admin.
- **UX Goal:** Quản trị server mà không biến thành trình duyệt dữ liệu riêng tư.
- **Data Binding:** `server.id, name, group_image_url, created_by_user_id, created_at, deleted_at, deletion_reason`; `server_membership.user_id, role, joined_at, left_at, ended_reason, ended_by_user_id`; `user_account.full_name, email` cho chọn người nhận; invite như U02; audit lý do trong `audit_log.purpose`.
- **Key Interactions:** Drawer metadata/thành viên; admin gửi direct invite, kick hoặc hủy vi phạm. Kick cập nhật membership, hủy ghi `server.deleted_by_user_id, deleted_at, deletion_reason` và kết thúc membership SERVER_DELETED. Không có nút đọc toàn bộ chat hay vào call âm thầm.
- **Trạng thái / Responsive:** Server đã hủy chỉ hiện metadata trạng thái, tắt enforcement trùng. Xử lý chat report qua M03 có purpose gate. Mobile drawer chiếm màn hình.

---

## M06 — Hàng đợi tài liệu

```text
+--------------------------------------------------------------------------------------------------------+
| UIT Connect | Quản trị                                [Về ứng dụng] [Thông báo] [Sáng/tối] [Tài khoản] |
| | Tổng quan       |  Quản trị > Tài liệu                                                               |
| | Report          |  Tài liệu                                                  [Quản lý phân loại]     |
| | Tài khoản       |  [Đang xử lý] [Chờ duyệt*] [Đã duyệt] [Từ chối] [Đã gỡ]                            |
| | Server          |  Tiêu đề [....................................................] [Tìm]              |
| | Tài liệu        |  +-----------------------+----------------+------------------+---------------+     |
| | Phân loại       |  | Tài liệu / lần nộp    | Người nộp      | Trạng thái       | Thời điểm     |     |
| | Diễn đàn        |  +-----------------------+----------------+------------------+---------------+     |
| | Audit log       |  | {Tiêu đề} / {ID}      | {Họ tên}       | {Trạng thái}     | {Ngày nộp}    |     |
| |                 |  | [Mở hồ sơ]            |                |                  |               |     |
| |                 |  +-----------------------+----------------+------------------+---------------+     |
| |                 |  [Trước] [Tiếp]                                                                    |
+--------------------------------------------------------------------------------------------------------+
```

**Screen Notes:**

- **Route / Quyền:** `/admin/documents` · `AdminDocumentsPage.tsx` — Admin.
- **UX Goal:** Hàng đợi tách rõ xử lý máy và quyết định con người.
- **Data Binding:** `document.id, title, visibility_status`; `document_submission.id, submitted_by_user_id, status, submitted_at`; `user_account.full_name`. Tab Đã gỡ lọc `document.visibility_status=REMOVED`, không tạo status REMOVED cho submission.
- **Key Interactions:** Row → M07 bằng submissionId; phân loại → M08. Các tab xử lý/duyệt/từ chối dùng submission status; từng row là lần nộp, phân biệt với tài liệu.
- **Trạng thái / Responsive:** Không cho duyệt tệp đang scan/xử lý. Rỗng mỗi tab có thông báo ngắn và chuyển tab; mobile records giữ submission id tránh nhầm lần nộp.

---

## M07 — Duyệt tài liệu

```text
+--------------------------------------------------------------------------------------------------------+
| UIT Connect | Quản trị                                [Về ứng dụng] [Thông báo] [Sáng/tối] [Tài khoản] |
| | Tổng quan       |  Tài liệu > {Tiêu đề} > {ID lần nộp}                                               |
| | Report          |  {Tiêu đề} | {Trạng thái nộp} | {Trạng thái hiển thị}                              |
| | Tài khoản       |  {Người nộp} | {Ngày nộp} | {Tên tệp} | {Kích thước}                               |
| | Server          |  +----------------------------------------+----------------------------------+     |
| | Tài liệu        |  | [Tệp*] [OCR]                          | Gợi ý AI - tham khảo             |      |
| | Phân loại       |  |                                       | Collection: {Tên} {Độ tin cậy}    |     |
| | Diễn đàn        |  |       XEM TRƯỚC TỆP / OCR             | Category: {Tên} {Độ tin cậy}      |     |
| | Audit log       |  |                                       |----------------------------------|      |
| |                 |  |                                       | Phân loại cuối cùng              |      |
| |                 |  |                                       | Collection [Chọn collection v]   |      |
| |                 |  |                                       | Category [{Tên} x] [Chọn v]       |     |
| |                 |  |                                       | Tag [{Tag} x] [Nhập tag...]       |     |
| |                 |  |                                       | [Duyệt] [Từ chối]                |      |
| |                 |  +----------------------------------------+----------------------------------+     |
| |                 |  Đã công khai: [Lưu phân loại] [Gỡ tài liệu]                                       |
+--------------------------------------------------------------------------------------------------------+
```

Dialog từ chối / gỡ tài liệu:

```text
+------------------------------------------------------------------------------------------------+
| Từ chối lần nộp {ID}?                                                     [Đóng]               |
| Lý do [.................................................................]                      |
| Người gửi sẽ nhận lý do để chỉnh sửa và gửi lại.                                               |
| [Hủy] [Từ chối]                                                                                |
| -----------------------------------------------------------------------                        |
| Gỡ tài liệu {Tiêu đề}?                                                                         |
| Lý do [.................................................................]                      |
| Tài liệu sẽ không còn xem hoặc tải công khai.                                                  |
| [Hủy] [Gỡ tài liệu]                                                                            |
+------------------------------------------------------------------------------------------------+
```

**Screen Notes:**

- **Route / Quyền:** `/admin/documents/:submissionId` · `AdminDocumentReviewPage.tsx` — Admin.
- **UX Goal:** So sánh đề xuất với quyết định cuối cùng, không tự động áp dụng AI.
- **Data Binding:** `document.title, tags, media_id, visibility_status, removal_reason`; `media.file_name, size_bytes, mime_type, status`; `document_submission.id, status, submitted_at, submitted_by_user_id, reviewed_by_user_id, reviewed_at, rejection_reason`; `agent_classification.document_submission_id, ocr_text`; suggestions từ `agent_classification_collection.collection_id, confidence` và `agent_classification_category.category_id, confidence`; quyết định qua `document_collection`, `document_category`, `collection.name`, `category.name`.
- **Key Interactions:** AI chỉ gợi ý; admin chọn collection cuối cùng bắt buộc theo yêu cầu nghiệp vụ, category/tag chỉnh riêng. Duyệt chuyển APPROVED và PUBLIC sau xác nhận backend; từ chối cần reason. Phân loại thủ công được khi không có gợi ý. Gỡ cập nhật `document.removed_by_user_id, removed_at, removal_reason, visibility_status=REMOVED`.
- **Trạng thái / Responsive:** Tệp chưa READY không cho duyệt; OCR chưa có hiển thị trạng thái thật. Hồ sơ lần cũ chỉ đọc; không suy ra snapshot tệp/metadata cũ vì submission không lưu phiên bản media. Mobile preview rồi AI rồi quyết định.

---

## M08 — Collection và category

```text
+--------------------------------------------------------------------------------------------------------+
| UIT Connect | Quản trị                                [Về ứng dụng] [Thông báo] [Sáng/tối] [Tài khoản] |
| | Tổng quan       |  Quản trị > Phân loại tài liệu                                                     |
| | Report          |  Collection và category                                                            |
| | Tài khoản       |  [Collection*] [Category]                                        [Tạo mới]         |
| | Server          |  +-----------------------------+--------------------------------------------+      |
| | Tài liệu        |  | Collection                  | {Collection đang chọn}                     |      |
| | Phân loại       |  | > {Tên collection}          | Tên  [{Tên}.............................]  |      |
| | Diễn đàn        |  |   - {Category được gán}     | Slug [{Slug}............................]  |      |
| | Audit log       |  |   - {Category được gán}     | Mô tả [{Mô tả}..........................]  |      |
| |                 |  | > {Tên collection}          | Category                                  |       |
| |                 |  |                             | [x] {Tên category}                        |       |
| |                 |  |                             | [ ] {Tên category}                        |       |
| |                 |  |                             | [Hủy thay đổi] [Lưu]                      |       |
| |                 |  +-----------------------------+--------------------------------------------+      |
+--------------------------------------------------------------------------------------------------------+
```

Form tạo collection và category:

```text
+------------------------------------------------------------------------------------------------+
| Tạo collection                                                           [Đóng]                |
| Tên [...........................]  Slug [...............................]                      |
| Mô tả [................................................................]                       |
| Category [Chọn category v]                                                                     |
| [Hủy] [Tạo collection]                                                                         |
| -----------------------------------------------------------------------                        |
| Tạo / sửa category                                                       [Đóng]                |
| Tên [..................................................................]                       |
| [Hủy] [Lưu category]                                                                           |
+------------------------------------------------------------------------------------------------+
```

**Screen Notes:**

- **Route / Quyền:** `/admin/document-taxonomy` · `AdminDocumentTaxonomyPage.tsx` — Admin.
- **UX Goal:** Phân loại bằng cây quan hệ nhẹ, form nằm cạnh lựa chọn.
- **Data Binding:** `collection.id, name, description, slug`; `category.id, name`; `collection_category.collection_id, category_id`. Tree là quan hệ gán nhiều-nhiều, không giả định parent_id cho category.
- **Key Interactions:** Tạo/sửa collection và category; gán/bỏ gán category cho collection. Không thêm thao tác xóa hoặc phân cấp chưa đặc tả. Category tab form chỉ có tên.
- **Trạng thái / Responsive:** Tên/slug trùng hiển thị lỗi trường theo unique constraint. Mobile danh sách rồi detail, có Quay lại; empty có Tạo collection/category.

---

## M09 — Kiểm duyệt diễn đàn

```text
+--------------------------------------------------------------------------------------------------------+
| UIT Connect | Quản trị                                [Về ứng dụng] [Thông báo] [Sáng/tối] [Tài khoản] |
| | Tổng quan       |  Quản trị > Diễn đàn                                                               |
| | Report          |  Kiểm duyệt diễn đàn                                                               |
| | Tài khoản       |  [Chờ duyệt*] [Bị report]  Trạng thái bài [Tất cả v] [Xóa bộ lọc]                  |
| | Server          |  +-----------------------------+--------------------------------------------+      |
| | Tài liệu        |  | {Tiêu đề}                   | {Tiêu đề đang chọn}                        |      |
| | Phân loại       |  | {Trạng thái} {Ngày tạo}     | {Tên hiển thị / Bí danh} | {Ngày tạo}       |     |
| | Diễn đàn        |  | [Mở]                        | [{Chủ đề}] [{Chủ đề}]                      |      |
| | Audit log       |  |-----------------------------| {Nội dung bài / bình luận}                 |      |
| |                 |  | {Tiêu đề}                   |                                            |      |
| |                 |  | {Trạng thái} {Ngày tạo}     | AI: {Đề xuất} | {Độ tin cậy}               |      |
| |                 |  | [Mở]                        | Gợi ý tham khảo                            |      |
| |                 |  |                             | [Duyệt] [Từ chối] [Sửa] [Gỡ]               |      |
| |                 |  |                             | [Xem report liên quan]                     |      |
| |                 |  |                             | [Xem danh tính: có mục đích]               |      |
| |                 |  +-----------------------------+--------------------------------------------+      |
+--------------------------------------------------------------------------------------------------------+
```

Dialog quyết định và chỉnh sửa:

```text
+------------------------------------------------------------------------------------------------+
| Từ chối bài viết                                                          [Đóng]               |
| Lý do [.................................................................]                      |
| [Hủy] [Từ chối]                                                                                |
| -----------------------------------------------------------------------                        |
| Sửa bài viết                                                                                   |
| Tiêu đề [{Tiêu đề}......................................................]                      |
| Nội dung [{Nội dung}....................................................]                      |
| Chủ đề [{Chủ đề} x] [Nhập chủ đề...]                                                           |
| Lý do kiểm duyệt [......................................................]                      |
| [Hủy] [Lưu chỉnh sửa và đưa về chờ duyệt]                                                      |
| -----------------------------------------------------------------------                        |
| Gỡ {Bài viết / Bình luận}?                                                                     |
| Lý do [.................................................................]                      |
| Nội dung sẽ không còn hiển thị công khai.                                                      |
| [Hủy] [Gỡ nội dung]                                                                            |
+------------------------------------------------------------------------------------------------+
```

**Screen Notes:**

- **Route / Quyền:** `/admin/forum` · `AdminForumModerationPage.tsx` — Admin.
- **UX Goal:** Đọc nội dung trước quyết định, giữ AI và danh tính nhạy cảm riêng.
- **Data Binding:** `forum_post.id, title, content, topics, is_anonymous, status, ai_recommendation, ai_confidence, created_at, moderated_by_user_id, moderated_at, moderation_reason`; `comment.id, forum_post_id, content, is_anonymous, status`; alias `anonymous_alias.display_alias`; reports `report.id, target_type, target_id, status`. Reveal có quyền mới đọc `author_user_id` → `user_account.full_name`, ghi `audit_log.purpose, actor_admin_id, action, target_type, target_id, report_id, occurred_at`.
- **Key Interactions:** Duyệt/từ chối bài pending; gỡ bài hoặc bình luận khi được phép. Bình luận không có AI/status pending riêng: không hiện duyệt/đề xuất AI cho comment. Xem danh tính dùng gate M03 theo phạm vi kiểm duyệt/report, không tải danh tính trước.
- **Trạng thái / Responsive:** Không có AI thì cho quyết định thủ công. Từ chối/sửa/gỡ có form/confirm tương ứng; reason bài → moderation_reason, reason gỡ comment → audit purpose. Mobile queue/detail chuyển qua lại thay vì hai cột hẹp.

---

## M10 — Nhật ký quản trị

```text
+--------------------------------------------------------------------------------------------------------+
| UIT Connect | Quản trị                                [Về ứng dụng] [Thông báo] [Sáng/tối] [Tài khoản] |
| | Tổng quan       |  Quản trị > Audit log                                                              |
| | Report          |  Nhật ký quản trị                                                                  |
| | Tài khoản       |  Người thực hiện [Admin v]  Đối tượng [Loại v] [ID...............]                 |
| | Server          |  Từ [Ngày giờ........] Đến [Ngày giờ........] [Lọc] [Xóa bộ lọc]                   |
| | Tài liệu        |  +----------------+--------------+----------------+----------------+-----------+   |
| | Phân loại       |  | Thời điểm      | Người làm    | Thao tác       | Đối tượng      | Mục đích  |   |
| | Diễn đàn        |  +----------------+--------------+----------------+----------------+-----------+   |
| | Audit log       |  | {Thời gian}    | {Họ tên}     | {Action}       | {Loại} {ID}    | {Purpose} |   |
| |                 |  | [Chi tiết]     |              |                |                |           |   |
| |                 |  +----------------+--------------+----------------+----------------+-----------+   |
| |                 |  [Trước] [Tiếp]                                                                    |
+--------------------------------------------------------------------------------------------------------+
```

Drawer sự kiện bất biến:

```text
+------------------------------------------------------------------------------------------------+
| Chi tiết sự kiện {ID}                                                     [Đóng]               |
| Người thực hiện: {Họ tên}                                                                      |
| Thao tác: {Action}                                                                             |
| Đối tượng: {Loại} / {ID}                                                                       |
| Mục đích: {Purpose}                                                                            |
| Thời điểm: {Occurred at}                                                                       |
| Report liên quan: {Report ID nếu có}                         [Mở report]                       |
| Metadata: {JSON được phép hiển thị, chỉ đọc}                                                   |
| Lưu đến: {Retain until}                                                                        |
+------------------------------------------------------------------------------------------------+
```

**Screen Notes:**

- **Route / Quyền:** `/admin/audit-logs` · `AdminAuditLogPage.tsx` — Admin; chỉ đọc.
- **UX Goal:** Truy vết mục đích và phạm vi từng hành động, không cho sửa log.
- **Data Binding:** `audit_log.id, actor_admin_id, action, target_type, target_id, report_id, purpose, occurred_at, metadata, retain_until`; actor join `user_account.full_name`.
- **Key Interactions:** Chọn row mở drawer read-only. Report link chỉ khi report_id có giá trị và còn quyền. Metadata render an toàn theo phạm vi admin được phép, không dùng làm lối đọc riêng tư ngoài gate.
- **Trạng thái / Responsive:** Khoảng ngày không hợp lệ báo inline; không có record hiển thị rỗng, không hứa lịch sử quá thời hạn lưu tối đa một năm. Mobile cards có đủ actor/action/target/time.

---
