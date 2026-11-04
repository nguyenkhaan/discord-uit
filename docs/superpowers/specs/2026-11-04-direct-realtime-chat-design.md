# Direct Realtime Chat Design

## Intent

Hoàn thiện trước luồng hai active members nhắn tin realtime qua một gateway instance. Kafka và transactional outbox được hoãn sang giai đoạn sau để giảm số thành phần cần vận hành trong lát cắt đầu tiên.

## Goals

- Socket handshake được xác thực bằng access token và session hiện hành.
- Client chỉ join server khi Spring xác nhận active membership.
- `chat-send` được Spring kiểm tra membership lại và persist idempotently vào `chat_message`.
- Sender nhận ACK chứa `messageId` và `createdAt` authoritative.
- Sau khi Spring trả thành công, gateway emit `chat-created` trực tiếp tới room `server:{serverId}`.

## Non-goals

- Không tạo `outbox_event`, Kafka publisher hoặc Kafka consumer.
- Không hỗ trợ nhiều gateway instance.
- Không bảo đảm realtime delivery nếu gateway chết sau DB commit nhưng trước khi emit.
- Chưa triển khai history/reconnect recovery, edit/delete, reaction hoặc presence.

## Chosen Approach

Gateway gọi internal REST để persist message, dùng response authoritative để ACK sender và emit trực tiếp tới generated room. Cách này phù hợp giới hạn một gateway instance và giữ Spring là nguồn sự thật cho identity, membership và message persistence.

Client gửi `serverId`, không gửi room name. Gateway validate UUID, yêu cầu Spring authorize membership, rồi tự tạo `server:{serverId}`. Room là chi tiết routing nội bộ, không phải capability do client lựa chọn.

## Alternatives Considered

- Giữ outbox nhưng chưa publish: bị loại vì tích tụ event `PENDING`; khi Kafka được bật sau này có thể phát lại một backlog không mong muốn.
- Để client emit message đã ACK cho các client khác: bị loại vì biến client thành nguồn phát event và làm các client khác phải tin dữ liệu do client kiểm soát.
- Polling message history: bị loại vì không đáp ứng mục tiêu nhắn tin realtime hiện tại.

## Flow

1. Gateway verify JWT và gọi Spring validate session.
2. `server-join` nhận UUID, Spring authorize active membership, gateway join generated room.
3. `chat-send` validate payload, kiểm tra socket đã join, áp dụng rate limit và gọi Spring.
4. Spring lấy user từ bearer token, recheck membership, create-or-get `chat_message` theo idempotency key và trả DTO persisted.
5. Gateway ACK sender và emit `chat-created` chứa DTO persisted tới room.

## Deferred Kafka Transition

Giai đoạn Kafka sau sẽ thêm transactional outbox tại Spring và consumer tại gateway. Direct emit sẽ được thay bằng emit từ consumer để tránh phát trùng; các contract message DTO và generated room vẫn được giữ nguyên.
