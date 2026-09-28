# YÊU CẦU SẢN PHẨM NỀN TẢNG GIAO TIẾP VÀ DIỄN ĐÀN

## 1. Tổng quan sản phẩm

Hệ thống là một nền tảng trực tuyến hỗ trợ người dùng trao đổi, cộng tác và chia sẻ kiến thức. Sản phẩm gồm các phân hệ chính:

- Tài khoản và xác thực người dùng.
- Server riêng tư dành cho chat và gọi video theo nhóm.
- Kho tài liệu công khai trên toàn hệ thống.
- Diễn đàn công khai có hỗ trợ đăng bài và bình luận ẩn danh.
- Hệ thống report và kiểm duyệt nội dung.
- Trung tâm thông báo trong ứng dụng.
- Admin Dashboard để quản lý và vận hành hệ thống.

Tất cả các phân hệ trên đều thuộc phạm vi chức năng hoàn chỉnh của sản phẩm.

## 2. Người dùng và vai trò

### 2.1. Người dùng thông thường

Hệ thống không giới hạn đối tượng sử dụng. Người dùng có thể đăng nhập bằng tài khoản sinh viên UIT hoặc đăng ký bằng email cá nhân.

Tài khoản UIT đã xác thực và tài khoản cá nhân ở trạng thái `active` có cùng quyền cơ bản. Cả hai loại tài khoản đều có thể:

- Tham gia server.
- Sử dụng chat và gọi video.
- Truy cập kho tài liệu.
- Đăng tài liệu.
- Đăng bài và bình luận trên diễn đàn.
- Sử dụng chức năng ẩn danh trên diễn đàn.
- Gửi report đối với nội dung hoặc đối tượng vi phạm.

### 2.2. Vai trò trong server

Mỗi server có hai vai trò:

- **Owner:** quản lý server và thành viên.
- **Member:** thành viên thông thường của server.

Một server có thể có nhiều Owner. Owner có thể nâng một Member thành Owner.

### 2.3. Người điều phối cuộc gọi

Người khởi tạo cuộc gọi trong server trở thành **Call Coordinator** của cuộc gọi đó. Đây là vai trò tạm thời, chỉ tồn tại trong phạm vi cuộc gọi và độc lập với vai trò Owner của server.

### 2.4. Admin

Admin quản lý và kiểm duyệt toàn bộ hệ thống thông qua Admin Dashboard. Quyền quản trị không cho phép admin tự do truy cập nội dung riêng tư. Admin chỉ được truy cập phần dữ liệu cần thiết để kiểm duyệt nội dung hoặc xử lý report; các lần truy cập dữ liệu nhạy cảm phải được ghi audit log theo quy định.

### 2.5. Agent phân loại tài liệu

Agent hỗ trợ đọc và phân loại tài liệu vào collection phù hợp. Agent chỉ đưa ra kết quả phân loại ban đầu; admin luôn là người quyết định cuối cùng.

### 2.6. AI Agent hỗ trợ kiểm duyệt diễn đàn

AI Agent phân tích nội dung bài viết và đề xuất kết quả kiểm duyệt cho admin. Agent không được tự động chấp thuận, từ chối, chỉnh sửa hoặc xóa bài viết; admin luôn là người quyết định cuối cùng.

## 3. Tài khoản và xác thực

### 3.1. Đăng nhập

Giao diện đăng nhập sử dụng email và mật khẩu.

Hệ thống phân biệt hai loại tài khoản dựa trên tên miền email:

- Email có đuôi `@uit.edu.vn` được xem là tài khoản UIT.
- Email không có đuôi `@uit.edu.vn` được xem là tài khoản cá nhân.

### 3.2. Xác thực tài khoản UIT

- Tài khoản `@uit.edu.vn` phải được xác thực thông qua API/SSO chính thức của UIT.
- Hệ thống không cho phép dùng email `@uit.edu.vn` để đăng ký theo luồng tài khoản cá nhân.
- Hệ thống không lưu mật khẩu tài khoản UIT.
- Sau khi UIT xác thực thành công, hệ thống tạo hoặc cập nhật hồ sơ người dùng nội bộ và cấp access token cùng refresh token của ứng dụng.

### 3.3. Đăng ký tài khoản cá nhân

- Người dùng bên ngoài có thể đăng ký bằng email cá nhân và mật khẩu.
- Luồng đăng ký tài khoản cá nhân phải từ chối mọi email có đuôi `@uit.edu.vn`.
- Mật khẩu tài khoản cá nhân phải được lưu dưới dạng hash an toàn, không lưu mật khẩu dạng rõ.
- Tài khoản mới được tạo ở trạng thái `unverified`.
- Hệ thống gửi liên kết hoặc mã xác thực dùng một lần, có thời hạn đến email đăng ký.
- Sau khi xác thực email thành công, hệ thống chuyển tài khoản sang trạng thái `active`.

### 3.4. Quản lý tài khoản cá nhân

- Người dùng đang đăng nhập có thể đổi mật khẩu sau khi xác nhận mật khẩu hiện tại.
- Người dùng quên mật khẩu có thể yêu cầu đặt lại mật khẩu qua email. Hệ thống phải trả về phản hồi chung, không tiết lộ email có tồn tại hay không.
- Liên kết hoặc token đặt lại mật khẩu chỉ được sử dụng một lần và phải có thời hạn hiệu lực.
- Sau khi đổi hoặc đặt lại mật khẩu thành công, hệ thống thu hồi các refresh token cũ của tài khoản.
- Người dùng có thể đổi email cá nhân sau khi xác thực lại danh tính. Email mới không được có đuôi `@uit.edu.vn`.
- Sau khi đổi email, tài khoản chuyển sang trạng thái `unverified` cho đến khi người dùng xác thực email mới.
- Người dùng có thể cập nhật thông tin cá nhân được hệ thống cho phép.

### 3.5. Trạng thái tài khoản cá nhân

Tài khoản cá nhân có ba trạng thái:

- `unverified`: tài khoản chưa xác thực email và chưa được sử dụng các chức năng chính.
- `active`: tài khoản đã xác thực email và được sử dụng các chức năng theo quyền của người dùng thông thường.
- `banned`: tài khoản bị admin khóa và không thể đăng nhập hoặc sử dụng hệ thống.

Admin có thể chuyển tài khoản sang trạng thái `banned`. Khi gỡ khóa, tài khoản trở về `active` nếu email đã được xác thực; nếu chưa, tài khoản trở về `unverified`.

### 3.6. Quyền sử dụng

Tài khoản UIT đã xác thực và tài khoản cá nhân ở trạng thái `active` có cùng quyền truy cập các chức năng cơ bản. Việc sử dụng email UIT để xác thực không tạo ra hàng rào truy cập đối với người dùng bên ngoài.

## 4. Server và quản lý thành viên

### 4.1. Mô hình server

- Server là không gian cộng tác riêng tư dành cho một nhóm người dùng.
- Server không xuất hiện trong danh mục công khai và không thể được tìm kiếm để tham gia tự do.
- Mỗi server chỉ có một luồng chat chung.
- Mỗi server chỉ có tối đa một cuộc gọi đang hoạt động tại một thời điểm.
- Server không chứa các channel hoặc phòng con.

### 4.2. Tạo server

Người dùng có thể tạo server mới. Người tạo server trở thành Owner đầu tiên của server.

### 4.3. Mời và tham gia server

Người dùng có thể tham gia server bằng một trong hai cách:

- Nhận lời mời trực tiếp do Owner gửi qua thông báo trong ứng dụng.
- Sử dụng liên kết mời do Owner tạo.

Người nhận có thể chấp nhận hoặc từ chối lời mời trực tiếp trong trung tâm thông báo.

Liên kết mời có thể được cấu hình theo:

- Thời hạn hiệu lực.
- Số lượt sử dụng tối đa.

### 4.4. Quản lý thành viên

- Owner có thể quản lý thành viên trong server.
- Owner có thể nâng Member thành Owner.
- Khi server không còn Owner, hệ thống tự động nâng Member có thời điểm tham gia server gần nhất thành Owner. Nếu server không còn Member, hệ thống không thực hiện chuyển quyền.
- Admin có quyền mời người dùng vào server, kick thành viên hoặc hủy server khi cần xử lý vi phạm.

### 4.5. Liên kết nội dung từ phân hệ khác

Người dùng có thể chia sẻ liên kết của tài liệu hoặc bài viết diễn đàn vào luồng chat của server. Dữ liệu gốc vẫn thuộc kho tài liệu hoặc diễn đàn và không trở thành dữ liệu riêng của server.

## 5. Realtime chat

### 5.1. Gửi và nhận tin nhắn

- Thành viên có thể gửi và nhận tin nhắn theo thời gian thực trong luồng chat chung của server.
- Hệ thống không hỗ trợ nhắn tin trực tiếp giữa hai người dùng.

### 5.2. Chỉnh sửa tin nhắn

- Người gửi có thể chỉnh sửa tin nhắn của mình.
- Tin nhắn đã chỉnh sửa phải hiển thị trạng thái **Đã chỉnh sửa**.

### 5.3. Xóa và gỡ tin nhắn

- Người gửi có thể xóa tin nhắn của mình.
- Owner có thể gỡ tin nhắn của Member khi nội dung vi phạm quy định của server hoặc hệ thống.
- Tin nhắn bị xóa được xử lý theo cơ chế xóa mềm trong thời hạn lưu trữ quy định.
- Nội dung xóa mềm được giữ tối đa 90 ngày để phục vụ report, khiếu nại và audit, sau đó được xóa vĩnh viễn.

### 5.4. Quyền riêng tư của chat

- Admin không được tự do đọc toàn bộ lịch sử chat của server riêng tư.
- Khi xử lý report, admin chỉ được xem metadata và phần nội dung có liên quan đến report.
- Việc admin truy cập nội dung liên quan đến report phải được ghi audit log.

## 6. Gọi video và chia sẻ màn hình

### 6.1. Khởi tạo và tham gia cuộc gọi

- Thành viên có thể khởi tạo cuộc gọi trong server nếu server chưa có cuộc gọi đang hoạt động.
- Mỗi cuộc gọi hỗ trợ tối đa 30 người tham gia đồng thời.
- Mọi người tham gia có thể chủ động bật hoặc tắt microphone và camera của mình.
- Thành viên vẫn có thể sử dụng luồng chat chung của server trong thời gian cuộc gọi diễn ra.

### 6.2. Chia sẻ màn hình

- Cuộc gọi hỗ trợ chia sẻ màn hình theo thời gian thực.
- Chỉ một người được chia sẻ màn hình tại một thời điểm.
- Người đang chia sẻ có thể chủ động dừng chia sẻ màn hình.

### 6.3. Call Coordinator

- Người khởi tạo cuộc gọi trở thành Call Coordinator.
- Call Coordinator có thể cưỡng chế tắt microphone của người tham gia.
- Call Coordinator có thể cưỡng chế dừng chia sẻ màn hình.
- Owner của server không tự động có quyền điều phối cuộc gọi.
- Nếu Call Coordinator rời cuộc gọi, cuộc gọi vẫn tiếp tục nhưng vai trò điều phối không được chuyển cho người khác.
- Khi Call Coordinator không có mặt, các chức năng cưỡng chế tắt microphone và dừng chia sẻ màn hình tạm thời không khả dụng.
- Nếu Call Coordinator tham gia lại, quyền điều phối của người đó được khôi phục.

### 6.4. Kết thúc cuộc gọi

Cuộc gọi kết thúc khi tất cả người tham gia đã rời khỏi cuộc gọi.

### 6.5. Quyền riêng tư của cuộc gọi

- Cuộc gọi không được ghi âm hoặc ghi hình mặc định.
- Admin không có quyền nghe lén hoặc tham gia âm thầm vào cuộc gọi.

## 7. Chia sẻ và phân loại tài liệu

### 7.1. Phạm vi kho tài liệu

- Kho tài liệu là không gian công khai trên toàn hệ thống và không thuộc bất kỳ server nào.
- Người dùng có thể đăng tải và tìm kiếm tài liệu do cộng đồng chia sẻ.
- Kho tài liệu hỗ trợ tài liệu thuộc nhiều lĩnh vực như công nghệ thông tin, kinh tế và giáo dục.
- Chỉ tài liệu đã được admin duyệt mới được hiển thị công khai.

### 7.2. Thông tin tài liệu

Mỗi tài liệu có các thông tin phục vụ phân loại và tìm kiếm, bao gồm:

- Tiêu đề.
- Tag do người dùng nhập.
- Collection chứa tài liệu.

### 7.3. Collection

- Mỗi tài liệu phải thuộc một collection.
- Collection đại diện cho chủ đề hoặc nhóm tài liệu.
- Collection được admin tạo và quản lý trước khi Agent thực hiện phân loại.

### 7.4. Quy trình tải lên và phân loại

1. Người dùng tải tài liệu lên hệ thống và nhập tag.
2. Tài liệu được đặt ở trạng thái chờ xử lý và chưa xuất hiện công khai.
3. Agent sử dụng OCR, nội dung đọc được từ tài liệu và tag do người dùng nhập để xác định collection phù hợp.
4. Tài liệu được lưu tạm thời trong collection do Agent đề xuất.
5. Admin kiểm tra kết quả phân loại và quyết định vị trí lưu trữ cuối cùng.

OCR chỉ được sử dụng để đọc, phân loại và tạo dữ liệu tìm kiếm cho tài liệu. Hệ thống không sử dụng nội dung OCR cho mục đích khác.

### 7.5. Kiểm duyệt tài liệu

Admin có thể:

- Chấp thuận tài liệu tại collection do Agent đề xuất.
- Chuyển tài liệu sang collection khác.
- Chỉnh sửa tag của tài liệu khi cần chuẩn hóa thông tin phân loại và tìm kiếm.
- Tự phân loại tài liệu khi không sử dụng đề xuất của Agent.
- Từ chối tài liệu.
- Gỡ tài liệu đã công khai khỏi kho tài liệu khi phát hiện vi phạm. Bằng chứng đã ghi nhận trong report vẫn được lưu theo chính sách tại mục 9.4.

Admin luôn là người đưa ra quyết định cuối cùng trước khi tài liệu được công khai.

### 7.6. Từ chối và gửi lại tài liệu

- Khi từ chối tài liệu, admin phải chọn hoặc ghi rõ lý do.
- Người tải tài liệu nhận được thông báo về việc từ chối và lý do tương ứng.
- Người tải tài liệu nhận được thông báo khi tài liệu của họ bị report. Thông báo không tiết lộ danh tính của người gửi report.
- Người dùng có thể chỉnh sửa tài liệu và gửi lại dưới dạng một lần gửi mới.
- Bản bị từ chối không xuất hiện trong kết quả tìm kiếm công khai.
- Bản bị từ chối được cách ly tối đa 90 ngày để phục vụ khiếu nại và audit, sau đó bị xóa vĩnh viễn.

### 7.7. Tìm kiếm tài liệu

Người dùng chỉ có thể tìm tài liệu đã được duyệt và đang hiển thị công khai theo:

- Tiêu đề.
- Tag.
- Collection.
- Nội dung do OCR trích xuất từ tài liệu.

Tài liệu đang chờ duyệt, bị từ chối hoặc đã bị gỡ không xuất hiện trong kết quả tìm kiếm công khai.

## 8. Diễn đàn

### 8.1. Phạm vi diễn đàn

- Diễn đàn là không gian công khai trên toàn hệ thống và không thuộc server.
- Người dùng có thể đăng bài về bất kỳ chủ đề nào.
- Người dùng có thể gắn một hoặc nhiều chủ đề cho bài viết để hỗ trợ tìm kiếm.
- Bài viết không bắt buộc thuộc topic hoặc danh mục do admin tạo.

### 8.2. Đăng, chỉnh sửa và duyệt bài viết

- Người dùng có thể tạo bài viết mới.
- Bài viết mới phải ở trạng thái chờ duyệt và chưa được công khai.
- Admin quyết định chấp thuận hoặc từ chối bài viết.
- Admin có thể chỉnh sửa hoặc xóa bài viết khi cần xử lý nội dung không phù hợp.
- AI Agent có thể phân tích nội dung và đề xuất kết quả kiểm duyệt để hỗ trợ admin. Admin luôn là người đưa ra quyết định cuối cùng.
- Chỉ bài viết được admin chấp thuận mới xuất hiện công khai trên diễn đàn.
- Hệ thống gửi thông báo cho tác giả khi bài viết được chấp thuận.
- Người dùng có thể chỉnh sửa bài viết của mình. Sau khi chỉnh sửa, bài viết quay lại trạng thái chờ duyệt và tạm thời không hiển thị công khai cho đến khi được admin chấp thuận lại.

### 8.3. Bình luận

- Người dùng có thể bình luận trên bài viết đã được công khai.
- Bình luận được hiển thị ngay và không cần admin duyệt trước.
- Người dùng có thể report bài viết hoặc bình luận vi phạm.
- Bài viết và bình luận bị report được admin xử lý sau khi đăng.

### 8.4. Đăng bài và bình luận ẩn danh

- Người dùng có thể chọn đăng bài ẩn danh.
- Người dùng có thể chọn bình luận ẩn danh.
- Hệ thống luôn lưu danh tính thật của người đăng bài hoặc bình luận ẩn danh.
- Người dùng thông thường không được nhìn thấy danh tính thật phía sau nội dung ẩn danh.

### 8.5. Bí danh ẩn danh theo bài viết

- Trong mỗi bài viết, một tài khoản sử dụng chế độ ẩn danh được gán một bí danh ổn định.
- Cùng một tài khoản luôn xuất hiện với cùng bí danh trong toàn bộ luồng của bài viết đó.
- Bí danh không được dùng để liên kết danh tính công khai giữa các bài viết khác nhau.
- Nếu người dùng đã đăng bài hoặc bình luận ẩn danh trong một luồng, các bình luận tiếp theo của người đó trong cùng luồng phải tiếp tục ở trạng thái ẩn danh.

### 8.6. Truy cập danh tính ẩn danh

- Admin có thể xem danh tính thật phía sau bài viết hoặc bình luận ẩn danh khi thực hiện kiểm duyệt hoặc xử lý report.
- Mọi lần admin truy cập danh tính thật phải được ghi audit log.
- Chế độ ẩn danh chỉ ẩn danh tính với cộng đồng, không ẩn danh tính với hệ thống.

### 8.7. Tìm kiếm và chia sẻ bài viết

- Người dùng có thể tìm bài viết đã được duyệt theo một hoặc nhiều chủ đề.
- Người dùng có thể chia sẻ liên kết bài viết diễn đàn vào luồng chat của server. Dữ liệu gốc vẫn thuộc diễn đàn.

## 9. Report và xử lý vi phạm

### 9.1. Đối tượng có thể report

Người dùng có thể report:

- Tài khoản.
- Server.
- Tin nhắn.
- Tài liệu.
- Bài viết diễn đàn.
- Bình luận diễn đàn.

### 9.2. Nội dung report

Mỗi report gồm:

- Lý do report.
- Mô tả bổ sung tùy chọn.
- Bằng chứng hoặc ngữ cảnh được hệ thống ghi nhận tại thời điểm gửi report.

Bằng chứng đi kèm report phải được giữ nguyên ngay cả khi nội dung nguồn bị sửa hoặc xóa sau đó.

### 9.3. Report hành vi trong cuộc gọi

Do cuộc gọi không được ghi âm hoặc ghi hình, report liên quan đến cuộc gọi chỉ ghi nhận:

- Người bị report.
- Thời điểm xảy ra sự việc.
- Loại hành vi được report.

### 9.4. Thời hạn lưu trữ

Bằng chứng report được lưu tối đa 180 ngày để phục vụ xử lý vi phạm và khiếu nại.

## 10. Thông báo trong ứng dụng

### 10.1. Trung tâm thông báo

- Mỗi người dùng có biểu tượng chuông để truy cập trung tâm thông báo.
- Trung tâm thông báo lưu các thông báo trong ứng dụng của người dùng.

### 10.2. Các thông báo thuộc phạm vi hệ thống

Thông báo trong ứng dụng được sử dụng cho các trường hợp gồm:

- Owner mời người dùng tham gia server.
- Admin gửi thông báo nội bộ riêng cho một người dùng.
- Thông báo tài liệu bị từ chối và lý do từ chối.
- Thông báo khi tài liệu của người dùng bị report.
- Thông báo khi bài viết diễn đàn của người dùng được chấp thuận.

Thông báo do admin gửi là thông báo một chiều, không phải tin nhắn trực tiếp giữa hai người dùng.

### 10.3. Thời hạn lưu trữ

Thông báo được giữ cho đến khi người dùng tự xóa hoặc tài khoản tương ứng bị xóa.

## 11. Admin Dashboard

Admin Dashboard cung cấp các nhóm chức năng sau:

### 11.1. Quản lý report

- Xem các report do người dùng gửi.
- Xem lý do, mô tả, bằng chứng và ngữ cảnh được ghi nhận.
- Truy cập đúng phần dữ liệu cần thiết để xử lý report.

### 11.2. Quản lý tài khoản

- Quản lý các tài khoản trong hệ thống.
- Xem và thay đổi trạng thái tài khoản cá nhân theo quy tắc tại mục 3.5.
- Xử lý tài khoản liên quan đến report hoặc vi phạm.

### 11.3. Quản lý server

- Hủy server vi phạm.
- Kick người dùng khỏi server.
- Mời người dùng vào server.

### 11.4. Quản lý kho tài liệu

- Tạo và quản lý collection.
- Xem kết quả phân loại do Agent đề xuất.
- Chấp thuận, thay đổi collection, chỉnh sửa tag hoặc từ chối tài liệu.
- Phân loại tài liệu thủ công.
- Ghi nhận lý do khi từ chối tài liệu.
- Gỡ tài liệu đã công khai khi phát hiện vi phạm.

### 11.5. Quản lý diễn đàn

- Xem và kiểm duyệt bài viết đang chờ duyệt.
- Chấp thuận, từ chối, chỉnh sửa hoặc xóa bài viết.
- Xem đề xuất kiểm duyệt do AI Agent cung cấp và đưa ra quyết định cuối cùng.
- Xử lý bài viết và bình luận bị report.
- Xem danh tính thật của nội dung ẩn danh khi thực hiện kiểm duyệt hoặc xử lý report.

### 11.6. Gửi thông báo

Admin có thể gửi thông báo in-app riêng đến từng tài khoản trong hệ thống.

### 11.7. Audit log

- Admin có thể xem audit log quản trị trong Admin Dashboard.
- Audit log quản trị được lưu tối đa một năm.
- Hệ thống phải ghi audit log khi admin truy cập nội dung chat riêng tư liên quan đến report.
- Hệ thống phải ghi audit log khi admin xem danh tính thật phía sau bài viết hoặc bình luận ẩn danh.

## 12. Yêu cầu vận hành chung

### 12.1. Quy mô mục tiêu

Hệ thống phải hoạt động ổn định ở quy mô:

- Khoảng 1.000 tài khoản.
- Tối đa 500 người dùng đồng thời.
- Tối đa 200 người dùng đồng thời tham gia các cuộc gọi trên toàn hệ thống.
- Tối đa 30 người trong một cuộc gọi.

Hệ thống chưa cần được thiết kế cho lớp học hàng trăm người trong cùng một cuộc gọi hoặc cho tải người dùng quy mô lớn hơn các ngưỡng trên.

### 12.2. Mục tiêu hoàn thành

Sản phẩm được xem là hoàn thành khi:

- Toàn bộ chức năng được mô tả trong tài liệu này hoạt động đầy đủ.
- Các luồng xác thực, chat, gọi video, chia sẻ tài liệu, diễn đàn, report, thông báo và quản trị hoạt động ổn định ở quy mô mục tiêu.
- Các giới hạn quyền riêng tư, kiểm duyệt và lưu trữ dữ liệu được tuân thủ.

Các chỉ số tăng trưởng như số người dùng hoạt động, số tài liệu hoặc số bài viết không phải là tiêu chí quyết định mức độ hoàn thành của sản phẩm.

## 13. Ngoài phạm vi

Các chức năng sau không thuộc phạm vi sản phẩm:

- Nhắn tin trực tiếp giữa hai người dùng.
- Danh mục server công khai hoặc tìm kiếm server để tham gia tự do.
- Nhiều channel chat hoặc nhiều phòng gọi con trong một server.
- Nhiều cuộc gọi hoạt động đồng thời trong cùng một server.
- Nhiều người chia sẻ màn hình đồng thời trong một cuộc gọi.
- Ghi âm hoặc ghi hình cuộc gọi mặc định.
- Admin nghe lén cuộc gọi hoặc tự do đọc toàn bộ lịch sử chat riêng tư.
- Diễn đàn bắt buộc sử dụng topic hoặc danh mục do admin tạo.
- Cuộc gọi dành cho lớp học hàng trăm người.
- Tối ưu hệ thống cho quy mô tải lớn hơn mức mục tiêu đã xác định.
