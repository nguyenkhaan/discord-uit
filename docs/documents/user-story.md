# USER STORIES

## 1. Tài khoản và xác thực

| Mã | Vai trò | User Story | Tham chiếu |
| :--- | :--- | :--- | :--- |
| AUTH-01 | Người dùng UIT | Là một người dùng UIT, tôi muốn đăng nhập qua SSO chính thức của UIT, để truy cập hệ thống bằng tài khoản trường. | 3.1, 3.2 |
| AUTH-02 | Người dùng cá nhân | Là một người dùng cá nhân, tôi muốn đăng nhập bằng email và mật khẩu, để truy cập các chức năng của hệ thống. | 3.1 |
| AUTH-03 | Người dùng cá nhân | Là một người dùng cá nhân, tôi muốn đăng ký bằng email cá nhân và mật khẩu, để tạo tài khoản sử dụng hệ thống. | 3.3 |
| AUTH-04 | Người dùng cá nhân | Là một người dùng cá nhân, tôi muốn xác thực email đăng ký, để chuyển tài khoản từ `unverified` sang `active`. | 3.3, 3.5 |
| AUTH-05 | Người dùng cá nhân | Là một người dùng cá nhân, tôi muốn đổi mật khẩu sau khi xác nhận mật khẩu hiện tại, để bảo vệ quyền truy cập tài khoản. | 3.4 |
| AUTH-06 | Người dùng cá nhân | Là một người dùng cá nhân, tôi muốn đặt lại mật khẩu qua email khi quên mật khẩu, để khôi phục quyền truy cập tài khoản. | 3.4 |
| AUTH-07 | Người dùng cá nhân | Là một người dùng cá nhân, tôi muốn đổi email và xác thực email mới, để cập nhật địa chỉ đăng nhập của tài khoản. | 3.4 |
| AUTH-08 | Người dùng cá nhân | Là một người dùng cá nhân, tôi muốn cập nhật thông tin cá nhân được hệ thống cho phép, để giữ hồ sơ của mình chính xác. | 3.4 |

## 2. Server và quản lý thành viên

| Mã | Vai trò | User Story | Tham chiếu |
| :--- | :--- | :--- | :--- |
| SRV-01 | Người dùng | Là một người dùng, tôi muốn tạo server mới, để có không gian cộng tác riêng cho nhóm. | 4.2 |
| SRV-02 | Owner | Là một Owner, tôi muốn gửi lời mời trực tiếp đến người dùng, để mời họ tham gia server. | 4.3 |
| SRV-03 | Người dùng | Là một người dùng, tôi muốn chấp nhận hoặc từ chối lời mời trực tiếp trong trung tâm thông báo, để chủ động quyết định việc tham gia server. | 4.3 |
| SRV-04 | Owner | Là một Owner, tôi muốn tạo liên kết mời có thời hạn và giới hạn lượt sử dụng, để kiểm soát quyền tham gia server. | 4.3 |
| SRV-05 | Người dùng | Là một người dùng, tôi muốn tham gia server bằng liên kết mời còn hiệu lực, để cộng tác với các thành viên trong server. | 4.3 |
| SRV-06 | Owner | Là một Owner, tôi muốn quản lý thành viên trong server, để duy trì nhóm cộng tác phù hợp. | 4.4 |
| SRV-07 | Owner | Là một Owner, tôi muốn nâng một Member thành Owner, để chia sẻ trách nhiệm quản lý server. | 2.2, 4.4 |
| SRV-08 | Member | Là một Member, tôi muốn chia sẻ liên kết tài liệu hoặc bài viết diễn đàn vào luồng chat, để thành viên khác truy cập nội dung gốc. | 4.5 |
| SRV-09 | Member | Là một Member, tôi muốn hệ thống tự động chọn Member tham gia gần nhất làm Owner khi server không còn Owner, để server tiếp tục có người quản lý. | 4.4 |

## 3. Realtime chat

| Mã | Vai trò | User Story | Tham chiếu |
| :--- | :--- | :--- | :--- |
| CHAT-01 | Member | Là một Member, tôi muốn gửi và nhận tin nhắn theo thời gian thực, để trao đổi với các thành viên trong server. | 5.1 |
| CHAT-02 | Member | Là một Member, tôi muốn chỉnh sửa tin nhắn của mình, để sửa nội dung đã gửi nhầm. | 5.2 |
| CHAT-03 | Member | Là một Member, tôi muốn xóa tin nhắn của mình, để loại bỏ nội dung không còn phù hợp. | 5.3 |
| CHAT-04 | Owner | Là một Owner, tôi muốn gỡ tin nhắn vi phạm của Member, để thực thi quy định của server và hệ thống. | 5.3 |

## 4. Gọi video và chia sẻ màn hình

| Mã | Vai trò | User Story | Tham chiếu |
| :--- | :--- | :--- | :--- |
| CALL-01 | Member | Là một Member, tôi muốn khởi tạo cuộc gọi khi server chưa có cuộc gọi hoạt động, để bắt đầu trao đổi trực tiếp với nhóm. | 6.1 |
| CALL-02 | Member | Là một Member, tôi muốn tham gia cuộc gọi và tự bật hoặc tắt microphone, camera, để kiểm soát việc truyền âm thanh và hình ảnh của mình. | 6.1 |
| CALL-03 | Member | Là một Member, tôi muốn tiếp tục sử dụng luồng chat chung khi đang tham gia cuộc gọi, để trao đổi thêm bằng văn bản. | 6.1 |
| CALL-04 | Người tham gia cuộc gọi | Là một người tham gia cuộc gọi, tôi muốn bắt đầu hoặc dừng chia sẻ màn hình, để trình bày nội dung với những người khác. | 6.2 |
| CALL-05 | Call Coordinator | Là một Call Coordinator, tôi muốn cưỡng chế tắt microphone của người tham gia, để xử lý âm thanh gây gián đoạn cuộc gọi. | 6.3 |
| CALL-06 | Call Coordinator | Là một Call Coordinator, tôi muốn cưỡng chế dừng chia sẻ màn hình, để xử lý nội dung chia sẻ không phù hợp. | 6.3 |

### Business rules

- Mỗi cuộc gọi hỗ trợ tối đa 30 người tham gia đồng thời.
- Chỉ một người được chia sẻ màn hình tại một thời điểm.
- Người khởi tạo cuộc gọi trở thành Call Coordinator; Owner không tự động có quyền điều phối.
- Khi Call Coordinator rời cuộc gọi, vai trò này không được chuyển cho người khác và các quyền điều phối tạm thời không khả dụng.
- Khi Call Coordinator tham gia lại, hệ thống khôi phục quyền điều phối cho người đó.
- Cuộc gọi kết thúc khi tất cả người tham gia đã rời đi.
- Hệ thống không ghi âm hoặc ghi hình cuộc gọi theo mặc định.
- Admin không được nghe lén hoặc tham gia âm thầm vào cuộc gọi.

## 5. Chia sẻ và phân loại tài liệu

| Mã | Vai trò | User Story | Tham chiếu |
| :--- | :--- | :--- | :--- |
| DOC-01 | Người dùng | Là một người dùng, tôi muốn truy cập kho tài liệu công khai, để tìm tài liệu do cộng đồng chia sẻ. | 7.1 |
| DOC-02 | Người dùng | Là một người dùng, tôi muốn tìm tài liệu đã được duyệt theo tiêu đề, tag, collection hoặc nội dung OCR, để nhanh chóng tìm được tài liệu phù hợp. | 7.7 |
| DOC-03 | Người dùng | Là một người dùng, tôi muốn tải tài liệu kèm tiêu đề và tag, để chia sẻ tài liệu và hỗ trợ quá trình phân loại. | 7.2, 7.4 |
| DOC-04 | Người dùng | Là một người dùng, tôi muốn chỉnh sửa và gửi lại tài liệu bị từ chối dưới dạng lần gửi mới, để khắc phục lý do từ chối. | 7.6 |
| DOC-05 | Admin | Là một admin, tôi muốn tạo và quản lý collection, để tổ chức tài liệu theo các nhóm phù hợp. | 7.3, 11.4 |
| DOC-06 | Admin | Là một admin, tôi muốn xem tài liệu theo trạng thái xử lý, để quản lý tài liệu chờ duyệt, đã duyệt, bị từ chối hoặc đã bị gỡ. | 7.4–7.6 |
| DOC-07 | Admin | Là một admin, tôi muốn xem collection do Agent đề xuất và đưa ra quyết định cuối cùng, để kiểm soát kết quả phân loại trước khi công khai tài liệu. | 7.4, 7.5 |
| DOC-08 | Admin | Là một admin, tôi muốn chuyển collection, chỉnh sửa tag hoặc tự phân loại tài liệu, để sửa kết quả phân loại chưa phù hợp. | 7.5 |
| DOC-09 | Admin | Là một admin, tôi muốn từ chối tài liệu và ghi rõ lý do, để người gửi biết cách chỉnh sửa trước khi gửi lại. | 7.5, 7.6 |
| DOC-10 | Admin | Là một admin, tôi muốn gỡ tài liệu đã công khai khi phát hiện vi phạm, để bảo vệ chất lượng và an toàn của kho tài liệu. | 7.5 |
| DOC-11 | Admin | Là một admin, tôi muốn Agent phân tích nội dung tài liệu, kết quả OCR và tag, để nhận đề xuất collection trước khi kiểm duyệt. | 2.5, 7.4 |

## 6. Diễn đàn

| Mã | Vai trò | User Story | Tham chiếu |
| :--- | :--- | :--- | :--- |
| FORUM-01 | Người dùng | Là một người dùng, tôi muốn đăng bài và gắn một hoặc nhiều chủ đề, để chia sẻ nội dung và hỗ trợ người khác tìm kiếm. | 8.1, 8.2 |
| FORUM-02 | Admin | Là một admin, tôi muốn chấp thuận hoặc từ chối bài viết đang chờ duyệt, để kiểm soát nội dung trước khi công khai. | 8.2, 11.5 |
| FORUM-03 | Admin | Là một admin, tôi muốn chỉnh sửa hoặc xóa bài viết không phù hợp, để xử lý nội dung vi phạm hoặc cần điều chỉnh. | 8.2, 11.5 |
| FORUM-04 | Admin | Là một admin, tôi muốn xem đề xuất kiểm duyệt của AI Agent, để giảm thời gian đánh giá nhưng vẫn giữ quyền quyết định cuối cùng. | 2.6, 8.2, 11.5 |
| FORUM-05 | Người dùng | Là một người dùng, tôi muốn xem và bình luận trên bài viết đã được duyệt, để tham gia trao đổi với cộng đồng. | 8.3 |
| FORUM-06 | Người dùng | Là một người dùng, tôi muốn chỉnh sửa bài viết của mình và gửi lại để duyệt, để cập nhật nội dung mà không bỏ qua quy trình kiểm duyệt. | 8.2 |
| FORUM-07 | Người dùng | Là một người dùng, tôi muốn đăng bài hoặc bình luận ẩn danh, để tham gia thảo luận mà không hiển thị danh tính thật với cộng đồng. | 8.4, 8.5 |
| FORUM-08 | Admin | Là một admin, tôi muốn xem danh tính thật của nội dung ẩn danh khi kiểm duyệt hoặc xử lý report, để có đủ thông tin xử lý nội dung vi phạm. | 8.6, 11.5 |
| FORUM-09 | Người dùng | Là một người dùng, tôi muốn tìm bài viết đã được duyệt theo một hoặc nhiều chủ đề, để nhanh chóng tìm được nội dung mình quan tâm. | 8.7 |
| FORUM-10 | Người dùng | Là một người dùng, tôi muốn chia sẻ liên kết bài viết vào luồng chat của server, để thành viên server truy cập bài viết gốc. | 4.5, 8.7 |
| FORUM-11 | Admin | Là một admin, tôi muốn xử lý bài viết hoặc bình luận bị report, để loại bỏ hoặc kiểm soát nội dung vi phạm sau khi đăng. | 8.3, 11.5 |

## 7. Report và xử lý vi phạm

| Mã | Vai trò | User Story | Tham chiếu |
| :--- | :--- | :--- | :--- |
| RPT-01 | Người dùng | Là một người dùng, tôi muốn report tài khoản, server, tin nhắn, tài liệu, bài viết hoặc bình luận vi phạm, để admin kiểm tra và xử lý. | 9.1 |
| RPT-02 | Người dùng | Là một người dùng, tôi muốn gửi report kèm lý do và mô tả bổ sung, để admin có đủ ngữ cảnh đánh giá vi phạm. | 9.2 |
| RPT-03 | Người tham gia cuộc gọi | Là một người tham gia cuộc gọi, tôi muốn report hành vi vi phạm kèm người vi phạm, thời điểm và loại hành vi, để admin có dữ liệu xử lý dù cuộc gọi không được ghi lại. | 9.3 |
| RPT-04 | Admin | Là một admin, tôi muốn xem danh sách và chi tiết report, để kiểm tra lý do, mô tả, bằng chứng và ngữ cảnh trước khi xử lý. | 11.1 |

## 8. Thông báo trong ứng dụng

| Mã | Vai trò | User Story | Tham chiếu |
| :--- | :--- | :--- | :--- |
| NOTI-01 | Người dùng | Là một người dùng, tôi muốn mở trung tâm thông báo từ biểu tượng chuông, để theo dõi lời mời và các cập nhật liên quan đến tài khoản hoặc nội dung của mình. | 10.1 |
| NOTI-02 | Người dùng | Là một người dùng, tôi muốn xóa thông báo không còn cần thiết, để quản lý danh sách thông báo của mình. | 10.3 |
| NOTI-03 | Admin | Là một admin, tôi muốn gửi thông báo in-app riêng cho một tài khoản, để truyền đạt thông tin hoặc quyết định xử lý. | 10.2, 11.6 |

## 9. Admin Dashboard

| Mã | Vai trò | User Story | Tham chiếu |
| :--- | :--- | :--- | :--- |
| ADMIN-01 | Admin | Là một admin, tôi muốn quản lý tài khoản và xử lý tài khoản liên quan đến report hoặc vi phạm, để bảo vệ an toàn của hệ thống. | 11.2 |
| ADMIN-02 | Admin | Là một admin, tôi muốn mời người dùng, kick thành viên hoặc hủy server vi phạm, để xử lý vi phạm trong server. | 4.4, 11.3 |
| ADMIN-03 | Admin | Là một admin, tôi muốn xem audit log quản trị, để kiểm tra lịch sử truy cập dữ liệu nhạy cảm và truy vết hoạt động xử lý. | 11.7 |
| ADMIN-04 | Admin | Là một admin, tôi muốn xem trạng thái `active`, `banned`, `unverified` và khóa hoặc gỡ khóa tài khoản theo quy tắc hệ thống, để kiểm soát quyền truy cập của tài khoản. | 3.5, 11.2 |

## 10. Yêu cầu vận hành và ngoài phạm vi

### Quy mô mục tiêu

- Khoảng 1.000 tài khoản.
- Tối đa 500 người dùng đồng thời.
- Tối đa 200 người dùng đồng thời tham gia các cuộc gọi trên toàn hệ thống.
- Tối đa 30 người trong một cuộc gọi.

### Ngoài phạm vi

- Nhắn tin trực tiếp giữa hai người dùng.
- Danh mục server công khai hoặc tìm kiếm server để tham gia tự do.
- Nhiều channel chat hoặc nhiều phòng gọi con trong một server.
- Nhiều cuộc gọi hoạt động đồng thời trong cùng một server.
- Nhiều người chia sẻ màn hình đồng thời trong một cuộc gọi.
- Ghi âm hoặc ghi hình cuộc gọi mặc định.
- Admin nghe lén cuộc gọi hoặc tự do đọc toàn bộ lịch sử chat riêng tư.
- Bắt buộc bài viết diễn đàn thuộc topic hoặc danh mục do admin tạo.
- Cuộc gọi dành cho lớp học hàng trăm người.
- Tối ưu hệ thống cho quy mô lớn hơn mức mục tiêu đã xác định.
