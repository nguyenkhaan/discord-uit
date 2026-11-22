# Admin document preview viewport

## Intent

Giữ khung xem trước tài liệu ổn định để nội dung dài không kéo giãn toàn bộ trang review. Người dùng vẫn đọc được tài liệu bằng cách cuộn bên trong vùng preview.

## Goals

- Header `Xem trước` và nút tải file luôn nằm cố định trong panel.
- Vùng nội dung có chiều cao responsive, đủ lớn để đọc khoảng một trang A4 trên màn hình desktop.
- PDF, DOCX, TXT và định dạng fallback đều dùng chung một viewport và không làm layout tăng chiều cao theo tài liệu.
- Giữ preview DOCX có scroll nội bộ sau khi `docx-preview` render nội dung.

## Non-goals

- Không thay đổi API preview/download.
- Không thay đổi nội dung tài liệu, tỷ lệ render hoặc thư viện `docx-preview`.
- Không xây thêm viewer chuyên biệt cho các định dạng chưa được backend hỗ trợ.

## Approach

Tách panel thành header cố định và content viewport dùng chiều cao responsive kiểu `clamp`, với `overflow-y-auto`. Viewer con sẽ dùng `height: 100%`: iframe PDF lấp đầy viewport, vùng mount DOCX có scroll nội bộ, TXT dùng `pre` với chiều cao đầy đủ, còn fallback căn giữa trong cùng vùng.

Đây là lựa chọn phù hợp hơn việc dùng canvas A4 tuyệt đối vì giữ được khả năng đọc rõ trên nhiều kích thước màn hình mà không ép tài liệu phải thu nhỏ quá mức.

## Constraints

- Tái sử dụng token/class Tailwind và component hiện có.
- Không để toàn bộ trang review scroll theo chiều dài của tài liệu preview.
- Vẫn hỗ trợ thao tác tải file và accessibility title cho iframe.

