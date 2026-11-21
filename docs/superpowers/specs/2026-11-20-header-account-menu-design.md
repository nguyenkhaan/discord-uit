# Header account menu design

## Intent

Khôi phục menu tài khoản trên avatar ở header để người dùng có thể mở các lựa chọn `Profile` và `Logout`. Mục tiêu của đợt này là hoàn thiện logout end-to-end; profile chỉ cần xuất hiện trong menu vì frontend hiện chưa có route profile.

## Goals

- Nhấn avatar sẽ mở/đóng dropdown tài khoản.
- Dropdown có đúng hai lựa chọn `Profile` và `Logout`.
- `Logout` gọi flow auth hiện có (`useAuth().logout()`), dọn session cache kể cả khi API lỗi, rồi chuyển về `/login`.
- Giữ accessibility hiện có: button semantic, `aria-expanded`, đóng khi click ngoài hoặc nhấn Escape, và focus quay về trigger.
- Hiển thị tên/initial từ user hiện tại khi có dữ liệu, với fallback tương thích dữ liệu cũ.

## Non-goals and constraints

- Không thêm endpoint hoặc thay đổi backend/API contract; `POST /auth/logout` và `AuthProvider.logout()` đã tồn tại.
- Không xây dựng trang profile hoặc thêm route mới trong thay đổi này.
- Không thêm dependency hay refactor menu admin.

## Approach

- Phương án đã chọn: sửa trực tiếp `src/components/Avatar.tsx` để component tự dùng `useAuth()`, `useNavigate()` và quản lý trạng thái dropdown tại chỗ. Đây là diff nhỏ nhất vì `Avatar` hiện chỉ được dùng trong header.
- Không chọn refactor menu account dùng chung vì sẽ mở rộng phạm vi sang admin menu.
- Không mở rộng `DropdownMenu` generic vì trigger hiện tại là nút ellipsis và việc thêm custom trigger sẽ tạo API/component change không cần thiết cho một nơi dùng.

## Behavior

- Trigger avatar có `aria-haspopup="menu"`, `aria-expanded` và tên tài khoản trong accessible label.
- Menu căn phải dưới avatar, gồm `Profile` và `Logout`; `Logout` có trạng thái đang xử lý để tránh gọi lặp.
- Khi logout thành công hoặc thất bại, `AuthProvider` vẫn clear local session; sau đó điều hướng về `/login` để AuthGuard không giữ người dùng ở vùng protected.
- `Profile` chưa có callback điều hướng trong đợt này và sẽ được nối khi route profile được xây dựng.

## Verification

- Bổ sung/cập nhật test service để xác nhận logout gọi `POST /auth/logout`.
- Cập nhật test header cho trigger và hai menu item.
- Chạy `bun test`, `bun run lint` và `bun run build` trong `app/frontend`.
