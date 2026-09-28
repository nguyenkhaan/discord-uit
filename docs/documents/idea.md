# NỀN TẢNG GIAO TIẾP - DIỄN ĐÀN CHO SINH VIÊN 
Xây dựng một nền tảng trực tuyến, hỗ trợ sinh viên trao đổi thông tin trong quá trình học tập.  
## Tính năng chính 
### Tài khoản xác thực 
- Sinh viên có thể đăng nhập vào hệ thống thông qua tài khoản sinh viên UIT. Hệ thống sẽ call API đến và cung cấp accessToken, refreshToken cho sinh viên. 
- Ngoài ra, người dùng bên ngoài còn có thể đăng ký tài khoản mới thông qua email cá nhân

### Realtime Chat Application 
**Chat Realtime**
- Mỗi nhóm chat tôi sẽ gọi là một server (giống discord). 
Hệ thống hỗ trợ các tính năng realtime giữa các người dùng 
- Người dùng có thể tạo ra các server, thêm người dùng khác vào nhóm hoặc gửi link để họ tham gia cuộc hội thoại bên trong server 
- Không hỗ trợ nhắn tin trực tiếp giữa 2 người (người - người, inbox cá nhân) giống như Messenger. 
- Người dùng có   thể gửi tin nhắn của mình đến đoạn hội thoại chung. 

**Video Calling** 
- Mỗi server có thể tổ chức calling video theo thời gian thực, hỗ trợ các chức năng cần thiết cho việc làm việc nhóm: Nhắn tin vào server, screen sharing, voice video calling... 

### Chia sẻ tài liệu 
- Tìm kiếm tài liệu do các sinh viên khác chia sẻ trong hệ thống. 
- Sinh viên có thể upload tài liệu lên phần chia sẻ tài liệu để hỗ trợ. Tài liệu hỗ trợ đa dạng chủ đề: IT, kinh tế, giáo dục,... phù hợp với tất cả ngành học 
- Đánh tag cho tài liệu. 
- Thông qua sự kiểm duyệt của admin. 

**Agent phân loại tài liệu**: Việc phân loại các tài liệu sẽ rất tốn thời gian. Vì vậy chúng ta cần một Agent hỗ trợ cho admin phâ loại từng tài liệu vào nơi phù hợp. 

### Diễn đàn. 
- Hỗ trợ việc đăng bài, người dùng khác có thể tham gia vào và thực hiện bình luận (giống như một diễn đàn thật sự). Đa dạng nhiều loại chủ đề 
- Hỗ trợ đăng bài ẩn danh trên hệ thống. 

### Admin dashboard 
Dùng để quản lý toàn bộ hệ thống 
- Quản lý report 
- Quản lý account 
- Gửi thông báo thầm kín qua người dùng 
- Quản lý tài liệu trong hệ thống (accept cái do agent đề xuất không? , nếu không có thể tạo và phân loại thủ công)
- Kiểm duyệt tài liệu thủ công 
- Kiểm duyệt nội dung đăng lên diễn đàn. 