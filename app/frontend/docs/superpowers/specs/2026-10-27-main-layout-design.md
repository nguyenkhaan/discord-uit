# Main layout design

## Mục tiêu

Tạo shell dùng chung cho các trang sau đăng nhập của UIT Connect: Sidebar điều hướng bên trái, Header ở phía trên vùng nội dung và `children` chiếm phần còn lại. Giao diện bám sát ảnh tham chiếu, sử dụng design token hiện có và icon từ `lucide-react`.

## Phạm vi

- Tạo `src/components/layout/MainLayout.tsx` nhận `children`.
- Tạo `src/components/layout/Sidebar.tsx` với các mục Trang chủ, Server, Tài liệu, Diễn đàn và Thông báo.
- Tận dụng và chỉnh trực tiếp `src/components/Header/Header.tsx`; giữ Logo và `NotificationBell`, đồng thời thêm nút menu mobile, ô tìm kiếm bằng primitive `Input`, avatar xanh và tên hardcode `Cloudian`.
- Cập nhật các import đang dùng Header sang vị trí mới.
- Thêm test hành vi tối thiểu cho layout và điều hướng.
- Không tự thêm trang nội dung, API người dùng, dropdown tài khoản hay logic thông báo mới.

## Bố cục và hành vi

- Từ breakpoint desktop: Sidebar rộng cố định nằm trọn chiều cao bên trái; vùng bên phải gồm Header sticky và `main` cuộn độc lập.
- Trên mobile: Sidebar đóng mặc định; nút menu trong Header mở lớp drawer có backdrop; chọn mục hoặc nhấn nút đóng/backdrop sẽ đóng drawer.
- Mục điều hướng hiện tại dùng `NavLink` để có trạng thái active theo URL.
- Logo nằm trong Sidebar trên desktop và xuất hiện trong Header trên mobile. Ô tìm kiếm có placeholder `Tìm server của bạn...`, nằm giữa Header trên desktop và được ẩn ở kích thước mobile hẹp để không làm chật thanh điều hướng.
- Các nút chỉ có icon có `aria-label`, trạng thái focus rõ ràng và vùng chạm tối thiểu 44px.

## Cấu trúc file

```text
src/components/layout/
├── MainLayout.tsx
└── Sidebar.tsx
src/components/Header/
└── Header.tsx
tests/components/layout/
└── MainLayout.test.tsx
```

## Các hướng đã cân nhắc

1. Sidebar responsive dạng drawer trên mobile — được chọn vì giữ đủ nhãn điều hướng, không làm hẹp nội dung và phù hợp ảnh desktop.
2. Sidebar luôn cố định — ít state hơn nhưng gây chật và có nguy cơ cuộn ngang trên điện thoại.
3. Thu nhỏ thành icon rail — gọn nhưng làm mất nhãn, giảm khả năng khám phá và khác hành vi mong muốn đã chọn.

## Ràng buộc và kiểm tra

- Dùng React, TypeScript strict, Tailwind CSS v4 và import nội bộ qua alias `@`.
- Không thêm dependency vì `lucide-react` đã có sẵn.
- Chạy test liên quan, `bun run lint` và `bun run build` trước khi hoàn tất.
