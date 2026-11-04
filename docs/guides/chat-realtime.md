# Chat realtime: manual test bằng Postman

## Dữ liệu test

|           | Giá trị                                        |
| --------- | ------------------------------------------------ |
| Server ID | `3c2e5a7b-9d1f-4a4c-8e6b-8f0a2c4d6e03`         |
| User A    | `realtime.alice@test.local` / `Realtime@123` |
| User B    | `realtime.bob@test.local` / `Realtime@123`   |

Cần chạy backend (`localhost:4000`) và gateway (`localhost:4001`) trước.

## 1. Lấy access token

Làm 2 lần, mỗi lần cho một user:

- `POST http://localhost:4000/api/auth/login`
- Body (raw JSON):

```json
{ "username": "realtime.alice@test.local", "password": "Realtime@123" }
```

- Copy `accessToken` trong response.

## 2. Mở 2 kết nối Socket.IO

Tạo 2 request Socket.IO (New → Socket.IO), một cho Alice, một cho Bob:

- URL: `http://localhost:4001`
- Settings → Client version: `v4`, Handshake path: `/api/realtime/socket.io`
- Headers: `Cookie: access_token=<accessToken của user đó>`
- Events → thêm listener `chat-created`
- Bấm **Connect**

Mỗi tab dùng đúng token của user đó. Không dựa vào cookie Postman tự lưu sau khi login, vì login user thứ hai sẽ ghi đè cookie của user thứ nhất.

## 3. Join server (cả 2 tab)

- Event name: `server-join`, bật **Ack**
- Message (JSON):

```json
{ "serverId": "3c2e5a7b-9d1f-4a4c-8e6b-8f0a2c4d6e03" }
```

Mong đợi ACK: `{ "ok": true, "data": { "serverId": "...", "role": "OWNER" } }` (Bob là `MEMBER`).

## 4. Gửi tin nhắn (tab Alice)

- Event name: `chat-send`, bật **Ack**
- Message (JSON):

```json
{
	"serverId": "3c2e5a7b-9d1f-4a4c-8e6b-8f0a2c4d6e03",
	"clientRequestId": "fa12ea65-d6d8-4a32-b7f2-53af3b38dd2f",
	"contentText": "Hello from Alice"
}
```

`clientRequestId` phải là UUID mới cho mỗi tin. Nếu Postman không thay `{{$guid}}`, hãy tự dán một UUID v4.

Mong đợi:

- Tab Alice nhận ACK `{ "ok": true, "data": { "messageId": "...", ... } }`.
- Cả tab Alice và tab Bob nhận event `chat-created` với cùng `messageId`.

## 5. Case lỗi

| Thao tác                                                          | ACK mong đợi                               |
| ------------------------------------------------------------------ | -------------------------------------------- |
| Gửi `chat-send` khi chưa `server-join`                       | `NOT_A_MEMBER`                             |
| `clientRequestId` không phải UUID, hoặc `contentText` rỗng | `INVALID_PAYLOAD`                          |
| Gửi quá 5 tin trong 10 giây                                     | `RATE_LIMITED`                             |
| Connect không có header `Cookie`                               | Kết nối bị từ chối: `UNAUTHENTICATED` |
