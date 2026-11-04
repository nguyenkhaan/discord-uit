# Realtime Chat Core (Phase 03) Implementation Plan

> **Superseded:** Kế hoạch này có Kafka/outbox và đã được thay bằng
> [`2026-11-04-direct-realtime-chat.md`](./2026-11-04-direct-realtime-chat.md).
> Giữ file này làm lịch sử cho giai đoạn Kafka triển khai sau.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hoàn thành lát cắt chạy được `chat-send` đã xác thực từ Socket.IO gateway, lưu `chat_message` và `outbox_event` atomically trong Spring Boot, publish qua Kafka và broadcast `chat-created` có ID đã persist cho các thành viên đang kết nối.

**Architecture:** Browser kết nối Socket.IO tới TypeScript gateway; gateway xác minh access token RS256 bằng JWKS rồi gọi internal REST của Spring để kiểm tra session, membership và thực thi command. Spring Boot là nguồn sự thật: ghi message cùng outbox trong một transaction, publisher đưa event lên `chat.events.v1`, KafkaJS consumer tại gateway phát event vào room `server:{serverId}`. ACK của người gửi đi theo REST, không chờ Kafka.

**Tech Stack:** Java 17, Spring Boot 4.1.1, Spring Security/Data JPA/Kafka, PostgreSQL/Supabase, Bun + TypeScript, Express, Socket.IO, `jose`, Zod, KafkaJS, JUnit 5, Bun test.

**Spec:** `docs/plans/phase_03.md`; kiến trúc chi tiết tại `docs/guides/architect.HTML` và `docs/guides/REALTIME-AGENT.md`.

## Global Constraints

- Giữ `app/realtime-gateway/main.ts` ở root; code theo trách nhiệm nằm trong `src/`.
- Gateway không đọc/ghi PostgreSQL và không tự quyết định membership; Spring Boot vẫn kiểm tra membership ở từng command.
- Spring Boot giữ private key; gateway chỉ dùng `GET /api/.well-known/jwks.json`, chấp nhận `RS256`, đúng `iss`, `aud`, `exp`, `sub`, `sid`, `jti` và `kid`.
- Internal REST luôn cần cả `Authorization: Bearer <access-token>` và `X-Gateway-Token`; không nhận `X-User-Id` làm danh tính.
- Socket.IO path là `/api/realtime/socket.io`; token ưu tiên lấy từ HttpOnly cookie `access_token`, chỉ fallback sang `handshake.auth.accessToken`, không đặt token trong query string.
- Room name luôn do server tạo theo `server:{serverId}`; client chỉ được gửi UUID `serverId`.
- `contentText` sau khi trim phải dài từ 1 đến 2.000 ký tự; gateway giới hạn 5 `chat-send` trong 10 giây cho mỗi user ở một process, Spring lặp lại validation độ dài.
- Idempotency key là `(server_id, sender_user_id, client_request_id)`; retry trả cùng `messageId` và không tạo outbox thứ hai.
- Kafka topic là `chat.events.v1`, message key là `serverId`, schema version là `1`, delivery là at-least-once.
- Chỉ hỗ trợ một gateway instance trong lát cắt này; không thêm Socket.IO Redis adapter.
- Không log raw JWT/cookie, gateway token, private/public key hoặc toàn bộ nội dung chat.
- Giữ nguyên các thay đổi chưa commit đang có trong JWT/JWKS/backend; không reset hoặc ghi đè ngoài phạm vi.
- Không triển khai REST history, reconnect history recovery, UI chat, edit/delete, reaction, typing/presence, LiveKit hoặc Kafka request/reply trong plan này.

## Review Focus

- Hai request đồng thời cùng idempotency key phải trả cùng message và chỉ một outbox; Task 4 có test concurrent retry.
- JWT hợp lệ về chữ ký nhưng session đã revoke phải bị từ chối trước khi socket kết nối; Task 2 có test fake Spring trả `401`.
- Socket đã join nhưng membership vừa bị thu hồi không được gửi message mới; Task 5 có test Spring trả `404` và gateway trả `NOT_A_MEMBER`.
- Kafka tạm dừng sau khi DB commit không được làm mất message; Task 6 và Task 8 kiểm tra outbox còn `PENDING` rồi publish sau recovery.
- Event Kafka malformed, sai `schemaVersion`, hoặc trùng `eventId` không được làm consumer crash hay phát lặp trong cùng process; Task 7 có test cho cả ba trường hợp.

---

## Tình trạng xuất phát

- Backend đã ký access token bằng RS256, expose JWKS, kiểm tra session/revocation/account trong `JwtRequestFilter`, và bảo vệ `/internal/realtime/**` bằng `GatewayServiceAuthenticationFilter`.
- `RealtimeInternalController` mới chỉ có `GET /internal/realtime/health`.
- `OutboxEvent`, `OutboxEventRepository` và `KafkaEventProducer` đã tồn tại; chưa có publisher tổng quát/claim retry và chưa có topic `chat.events.v1`.
- Gateway Bun/TypeScript đã load `PORT`, `SPRING_BASE_URL`, `GATEWAY_SERVICE_TOKEN` và gọi được internal health; các thư mục `auth`, `contracts`, `health`, `messaging`, `socket` còn trống.
- PostgreSQL dùng `ddl-auto=none`; file migration phải được review và apply rõ ràng, không giả định Hibernate tự tạo bảng.

## Contract cố định cho lát cắt này

```ts
type SocketAck<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; retryable: boolean } };

type ServerJoinCommand = { serverId: string };
type ServerLeaveCommand = { serverId: string };
type ChatSendCommand = {
  serverId: string;
  clientRequestId: string;
  contentText: string;
};

type ChatMessageDto = {
  messageId: string;
  serverId: string;
  senderUserId: string;
  clientRequestId: string;
  contentText: string;
  createdAt: string;
};

type ChatCreatedEnvelope = {
  schemaVersion: 1;
  eventId: string;
  eventType: "CHAT_CREATED";
  occurredAt: string;
  aggregateType: "CHAT_MESSAGE";
  aggregateId: string;
  serverId: string;
  data: Omit<ChatMessageDto, "serverId">;
};
```

Stable Socket.IO error codes: `UNAUTHENTICATED`, `NOT_A_MEMBER`, `INVALID_PAYLOAD`, `RATE_LIMITED`, `BACKEND_UNAVAILABLE`, `INTERNAL_ERROR`.

## Sơ đồ phụ thuộc

```text
Task 1 contracts/config/server
  └─ Task 2 authenticated socket
       └─ Task 3 authorized room
            ├─ Task 4 persisted chat + outbox
            │    ├─ Task 5 chat-send ACK
            │    └─ Task 6 outbox → Kafka
            │          └─ Task 7 Kafka → chat-created
            └──────────────────────────────┘
                           └─ Task 8 end-to-end proof
```

## File map dự kiến

- `app/realtime-gateway/main.ts`: composition root, startup và graceful shutdown.
- `app/realtime-gateway/src/contracts/realtime.ts`: TypeScript types và Zod schemas dùng chung trong gateway.
- `app/realtime-gateway/src/auth/*`: lấy token, verify JWKS, authenticate handshake.
- `app/realtime-gateway/src/backend/backend-client.ts`: duy nhất nơi gọi internal REST và map lỗi HTTP.
- `app/realtime-gateway/src/socket/*`: khởi tạo Socket.IO, room handlers, chat handler, ACK mapping/rate limit.
- `app/realtime-gateway/src/messaging/*`: Kafka consumer, event validation, bounded dedup cache.
- `app/backend/src/main/java/com/cloudian/backend/modules/realtime/*`: internal controller, DTO và session/membership authorization.
- `app/backend/src/main/java/com/cloudian/backend/modules/chat/*`: message entity workflow, idempotency và chat event data.
- `app/backend/src/main/java/com/cloudian/backend/messagings/*`: claim/publish chat outbox.
- `app/backend/src/main/resources/db/migration/V20261104_01__create_chat_message.sql`: schema có unique idempotency key.

---

### Task 1: Khóa contract, cấu hình và HTTP/Socket.IO server shell

**Files:**
- Modify: `app/realtime-gateway/package.json`
- Modify: `app/realtime-gateway/src/config/env.ts`
- Modify: `app/realtime-gateway/.env.example`
- Create: `app/realtime-gateway/src/contracts/realtime.ts`
- Create: `app/realtime-gateway/src/health/health-router.ts`
- Create: `app/realtime-gateway/src/socket/create-socket-server.ts`
- Modify: `app/realtime-gateway/main.ts`
- Test: `app/realtime-gateway/src/config/env.test.ts`
- Test: `app/realtime-gateway/src/contracts/realtime.test.ts`

**Interfaces:**
- Consumes: `BackendClient.checkInternalHealth()` hiện có.
- Produces: `GatewayConfig` có `frontendOrigin`, `socketIoPath`, JWT/Kafka/chat-limit settings; Zod schemas/types trong contract ở trên; `createSocketServer(config): { httpServer, io }`.

**Acceptance Criteria:**
- `GET /live` trả `200`; `GET /ready` chỉ trả `200` sau khi startup dependencies đã khởi tạo.
- Server dùng Express gắn vào `node:http`, Socket.IO dùng đúng `/api/realtime/socket.io`, CORS chỉ cho `FRONTEND_ORIGIN` với credentials.
- Thiếu hoặc sai bất kỳ config bắt buộc nào làm process fail fast và không in secret.

- [ ] **Step 1: Viết test fail cho cấu hình và schema**: thiếu `JWT_JWKS_URL`, Kafka broker rỗng, UUID sai và `contentText` dài 2.001 ký tự đều bị reject; 2.000 ký tự được accept.
- [ ] **Step 2: Chạy `cd app/realtime-gateway && bun test src/config/env.test.ts src/contracts/realtime.test.ts`**; expected FAIL vì config/schema chưa tồn tại.
- [ ] **Step 3: Cài dependencies** bằng `bun add express socket.io jose zod kafkajs cookie` và dev dependencies bằng `bun add -d @types/express socket.io-client`.
- [ ] **Step 4: Mở rộng `loadEnv(): GatewayConfig`** với `FRONTEND_ORIGIN`, `SOCKET_IO_PATH`, `JWT_ISSUER`, `JWT_AUDIENCE`, `JWT_JWKS_URL`, `KAFKA_BROKERS`, `KAFKA_CLIENT_ID`, `KAFKA_GROUP_ID`, `CHAT_EVENTS_TOPIC`, giới hạn chat và defaults đã khóa ở Global Constraints.
- [ ] **Step 5: Tạo contract types và Zod schemas** cho command, ACK, `ChatMessageDto`, `ChatCreatedEnvelope`; schema UUID dùng UUID chuẩn và timestamp dùng ISO-8601.
- [ ] **Step 6: Tạo Express health routes và `createSocketServer(config)`**, sau đó đổi `main.ts` thành composition root nhưng chưa register auth/handlers/consumer.
- [ ] **Step 7: Chạy `bun test` và `bun run typecheck`**; expected tất cả PASS và không có TypeScript error.
- [ ] **Step 8: Commit** bằng `git commit -m "feat(realtime): bootstrap socket gateway contracts"`.

---

### Task 2: Xác thực Socket.IO bằng JWKS và trạng thái session của Spring

**Files:**
- Modify: `app/backend/src/main/java/com/cloudian/backend/filters/JwtRequestFilter.java`
- Create: `app/backend/src/main/java/com/cloudian/backend/modules/realtime/dto/RealtimeSessionResponse.java`
- Modify: `app/backend/src/main/java/com/cloudian/backend/modules/realtime/RealtimeInternalController.java`
- Test: `app/backend/src/test/java/com/cloudian/backend/filters/JwtRequestFilterTests.java`
- Test: `app/backend/src/test/java/com/cloudian/backend/modules/realtime/RealtimeInternalControllerTests.java`
- Create: `app/realtime-gateway/src/auth/access-token.ts`
- Create: `app/realtime-gateway/src/auth/jwt-verifier.ts`
- Create: `app/realtime-gateway/src/auth/socket-auth.ts`
- Modify: `app/realtime-gateway/src/backend/backend-client.ts`
- Modify: `app/realtime-gateway/src/socket/create-socket-server.ts`
- Test: `app/realtime-gateway/src/auth/socket-auth.test.ts`

**Interfaces:**
- Consumes: JWKS contract hiện có và `GatewayConfig` từ Task 1.
- Produces: `POST /api/internal/realtime/session/validate -> RealtimeSessionResponse(UUID userId, UUID sessionId, AccountStatus accountStatus)`; `verifyAccessToken(token): Promise<VerifiedAccessToken>`; `BackendClient.validateSession(accessToken): Promise<SessionValidationResponse>`; `socket.data.auth = { accessToken, userId, sessionId, authorizedServerIds: Set<string> }`.

**Acceptance Criteria:**
- Token thiếu/sai chữ ký, algorithm, issuer, audience hoặc required claims bị handshake reject với `connect_error` sanitized.
- Token đúng chữ ký nhưng Spring trả `401` do revoked/expired session vẫn bị reject.
- Gateway không chứa private key; JWKS được `jose` cache/fetch theo `kid`.

- [ ] **Step 1: Viết backend tests fail**: valid JWT filter đặt request attribute `realtime.sessionId`; endpoint validate trả đúng `userId`, `sessionId`, `ACTIVE`; request không authenticate vẫn là `401` qua SecurityConfig.
- [ ] **Step 2: Chạy `cd app/backend && ./gradlew test --tests '*JwtRequestFilterTests' --tests '*RealtimeInternalControllerTests'`**; expected FAIL vì attribute/endpoint chưa có.
- [ ] **Step 3: Thêm `JwtRequestFilter.AUTHENTICATED_SESSION_ID_ATTRIBUTE`** và set UUID `sid` lên request sau khi session được xác thực; thêm `@PostMapping("/session/validate")` dùng `@AuthenticationPrincipal CustomUserDetails` và request attribute này.
- [ ] **Step 4: Chạy lại backend tests**; expected PASS.
- [ ] **Step 5: Viết gateway handshake test fail** dùng RSA key/JWKS server test và fake Spring: valid token connect được; missing token, wrong `kid`, wrong `aud`, và fake Spring `401` đều nhận `connect_error` không chứa token/internal response.
- [ ] **Step 6: Chạy `cd app/realtime-gateway && bun test src/auth/socket-auth.test.ts`**; expected FAIL vì middleware chưa tồn tại.
- [ ] **Step 7: Implement `extractAccessToken(handshake)`, `verifyAccessToken(token)` và Socket.IO middleware**; chỉ forward raw token vào Spring, không log/store ngoài `socket.data`.
- [ ] **Step 8: Chạy gateway test, `bun run typecheck`, rồi toàn bộ backend test liên quan**; expected PASS.
- [ ] **Step 9: Commit** bằng `git commit -m "feat(realtime): authenticate socket sessions"`.

---

### Task 3: Authorize room bằng active membership

**Files:**
- Create: `app/backend/src/main/java/com/cloudian/backend/modules/realtime/RealtimeAuthorizationService.java`
- Create: `app/backend/src/main/java/com/cloudian/backend/modules/realtime/dto/RealtimeServerAuthorizationResponse.java`
- Modify: `app/backend/src/main/java/com/cloudian/backend/modules/realtime/RealtimeInternalController.java`
- Test: `app/backend/src/test/java/com/cloudian/backend/modules/realtime/RealtimeAuthorizationServiceTests.java`
- Modify: `app/realtime-gateway/src/backend/backend-client.ts`
- Create: `app/realtime-gateway/src/socket/room-name.ts`
- Create: `app/realtime-gateway/src/socket/server-room-handlers.ts`
- Modify: `app/realtime-gateway/src/socket/create-socket-server.ts`
- Test: `app/realtime-gateway/src/socket/server-room-handlers.test.ts`

**Interfaces:**
- Consumes: `ServerMembershipRepository.findActiveRole(serverId, userId)` và authenticated `socket.data.auth` từ Task 2.
- Produces: `POST /api/internal/realtime/servers/{serverId}/authorize`; `authorizeServer(serverId, userId): RealtimeServerAuthorizationResponse`; `roomName(serverId): string`; handlers `server-join`/`server-leave` với `SocketAck`.

**Acceptance Criteria:**
- Active member nhận role và join đúng room generated; non-member/server deleted nhận non-enumerating `404` từ Spring và `NOT_A_MEMBER` ở socket.
- Client không thể truyền raw room name hoặc làm gateway join room ngoài `server:{validatedUuid}`.
- Leave xóa server khỏi `authorizedServerIds` và rời room.

- [ ] **Step 1: Viết backend service tests fail** cho active `MEMBER`, active `OWNER`, membership đã `left_at`, và server đã deleted.
- [ ] **Step 2: Chạy `cd app/backend && ./gradlew test --tests '*RealtimeAuthorizationServiceTests'`**; expected FAIL vì service chưa có.
- [ ] **Step 3: Implement `authorizeServer(UUID serverId, UUID userId)` và endpoint authorize**; trường hợp không active luôn throw `ApiException(HttpStatus.NOT_FOUND, "Server not found.")`.
- [ ] **Step 4: Chạy backend tests**; expected PASS.
- [ ] **Step 5: Viết gateway handler tests fail**: UUID hợp lệ/member join thành công; UUID sai không gọi Spring; Spring `404` không join; `server-leave` rời đúng room.
- [ ] **Step 6: Implement `BackendClient.authorizeServer(accessToken, serverId)`, `roomName()` và handlers**; gateway tự tạo room name.
- [ ] **Step 7: Chạy `bun test src/socket/server-room-handlers.test.ts` và `bun run typecheck`**; expected PASS.
- [ ] **Step 8: Commit** bằng `git commit -m "feat(realtime): authorize server socket rooms"`.

---

### Task 4: Persist chat idempotently cùng transactional outbox

**Files:**
- Create: `app/backend/src/main/resources/db/migration/V20261104_01__create_chat_message.sql`
- Modify: `app/backend/build.gradle`
- Create: `app/backend/src/main/java/com/cloudian/backend/models/ChatMessage.java`
- Create: `app/backend/src/main/java/com/cloudian/backend/repositories/ChatMessageRepository.java`
- Create: `app/backend/src/main/java/com/cloudian/backend/modules/chat/dto/CreateChatMessageRequest.java`
- Create: `app/backend/src/main/java/com/cloudian/backend/modules/chat/dto/ChatMessageResponse.java`
- Create: `app/backend/src/main/java/com/cloudian/backend/modules/chat/messaging/ChatCreatedEventData.java`
- Create: `app/backend/src/main/java/com/cloudian/backend/modules/chat/ChatMessageWriter.java`
- Create: `app/backend/src/main/java/com/cloudian/backend/modules/chat/ChatMessageCommandService.java`
- Modify: `app/backend/src/main/java/com/cloudian/backend/modules/realtime/RealtimeInternalController.java`
- Test: `app/backend/src/test/java/com/cloudian/backend/modules/chat/ChatMessageCommandServiceTests.java`
- Test: `app/backend/src/test/java/com/cloudian/backend/modules/chat/ChatMessagePersistenceIntegrationTests.java`

**Interfaces:**
- Consumes: active-membership policy từ Task 3, `OutboxEventRepository`, `ObjectMapper`.
- Produces: `POST /api/internal/realtime/servers/{serverId}/messages`; `createOrGet(UUID serverId, UUID senderUserId, CreateChatMessageRequest request): ChatMessageResponse`; repository lookup `findByServer_IdAndSender_IdAndClientRequestId(...)`; pending outbox type `CHAT_CREATED` chứa `ChatCreatedEventData`.

**Acceptance Criteria:**
- Insert message và outbox cùng transaction; lỗi outbox rollback message.
- Retry tuần tự hoặc đồng thời với cùng key trả cùng message và chỉ có một outbox.
- Non-member bị `404`; blank hoặc quá 2.000 ký tự bị `400` và không tạo row.

- [ ] **Step 1: Viết migration** tạo đủ các cột Phase 03 cho `chat_message`, foreign keys/index và unique `(server_id, sender_user_id, client_request_id)`; migration không sửa bảng hiện có ngoài quan hệ cần thiết.
- [ ] **Step 2: Viết service tests fail** cho create thành công, non-member, duplicate retry, và serialization/outbox failure rollback contract.
- [ ] **Step 3: Thêm `spring-boot-testcontainers` và Testcontainers PostgreSQL vào test dependencies, rồi viết persistence integration test fail** dùng `@SpringBootTest`, PostgreSQL container và `spring.jpa.hibernate.ddl-auto=create-drop`: hai thread gửi cùng key, sau commit query đúng một `chat_message` và một `CHAT_CREATED` outbox; một outbox-save failure phải để cả hai bảng không có row mới.
- [ ] **Step 4: Chạy `cd app/backend && ./gradlew test --tests '*ChatMessageCommandServiceTests' --tests '*ChatMessagePersistenceIntegrationTests'`**; expected FAIL vì model/service/schema chưa có.
- [ ] **Step 5: Implement entity, repository và DTO**; `CreateChatMessageRequest` dùng `@NotBlank`, `@Size(max = 2000)` và UUID `clientRequestId`.
- [ ] **Step 6: Implement `ChatMessageWriter.create(...)` trong transaction mới** để recheck membership, save message rồi save pending outbox; payload chỉ chứa dữ liệu cần cho `chat-created`.
- [ ] **Step 7: Implement `ChatMessageCommandService.createOrGet(...)`**: lookup trước, gọi writer, bắt unique-key race sau transaction thất bại rồi lookup row thắng cuộc; không bắt các integrity error khác.
- [ ] **Step 8: Thêm internal message endpoint** lấy user ID từ principal, trả `200` cho cả create và idempotent retry.
- [ ] **Step 9: Chạy tests ở Step 4 và `./gradlew test`**; expected PASS.
- [ ] **Step 10: Commit** bằng `git commit -m "feat(chat): persist idempotent messages with outbox"`.

---

### Task 5: Forward `chat-send`, rate limit và trả ACK authoritative

**Files:**
- Modify: `app/realtime-gateway/src/backend/backend-client.ts`
- Create: `app/realtime-gateway/src/socket/chat-rate-limiter.ts`
- Create: `app/realtime-gateway/src/socket/socket-error-mapper.ts`
- Create: `app/realtime-gateway/src/socket/chat-handlers.ts`
- Modify: `app/realtime-gateway/src/socket/create-socket-server.ts`
- Test: `app/realtime-gateway/src/socket/chat-handlers.test.ts`

**Interfaces:**
- Consumes: `ChatSendCommandSchema`, `SocketAck`, authenticated/authorized socket state, Spring endpoint từ Task 4.
- Produces: `BackendClient.createChatMessage(accessToken, serverId, request): Promise<ChatMessageDto>`; `registerChatHandlers(socket, backendClient, limiter): void`; ACK `SocketAck<ChatMessageDto>`.

**Acceptance Criteria:**
- Payload hợp lệ từ member đã join được forward và ACK chứa persisted `messageId`/`createdAt` từ Spring.
- Invalid payload/rate limited/not joined không gọi Spring.
- Spring `400/401/404/5xx` lần lượt map thành stable sanitized ACK; membership revoke sau join map thành `NOT_A_MEMBER`.

- [ ] **Step 1: Viết tests fail** cho success, duplicate ACK cùng ID, invalid UUID, empty/2.001 chars, chưa join, rate limit request thứ 6, Spring `404`, timeout và `500`.
- [ ] **Step 2: Chạy `cd app/realtime-gateway && bun test src/socket/chat-handlers.test.ts`**; expected FAIL vì handler chưa có.
- [ ] **Step 3: Refactor `BackendClient`** thành một private JSON request primitive có timeout và typed `BackendError`; mọi internal call tự gắn `X-Gateway-Token`, user calls gắn thêm bearer token.
- [ ] **Step 4: Implement per-user in-memory limiter** với window 10 giây, tối đa 5 send, dọn key hết hạn để không tăng memory vô hạn.
- [ ] **Step 5: Implement error mapper và `chat-send` handler**; validate trước, kiểm tra `authorizedServerIds`, rate limit, gọi Spring và callback đúng một lần.
- [ ] **Step 6: Chạy test, `bun run typecheck`, và toàn bộ `bun test`**; expected PASS.
- [ ] **Step 7: Commit** bằng `git commit -m "feat(realtime): forward chat commands with acknowledgements"`.

---

### Task 6: Publish chat outbox lên Kafka có retry

**Files:**
- Modify: `app/backend/src/main/java/com/cloudian/backend/repositories/OutboxEventRepository.java`
- Modify: `app/backend/src/main/java/com/cloudian/backend/messagings/KafkaEventProducer.java`
- Create: `app/backend/src/main/java/com/cloudian/backend/modules/chat/messaging/ChatCreatedEnvelope.java`
- Create: `app/backend/src/main/java/com/cloudian/backend/messagings/ChatOutboxPublisher.java`
- Modify: `app/backend/src/main/java/com/cloudian/backend/BackendApplication.java`
- Modify: `app/backend/src/main/resources/application.properties`
- Modify: `docker-compose.yaml`
- Test: `app/backend/src/test/java/com/cloudian/backend/messagings/ChatOutboxPublisherTests.java`

**Interfaces:**
- Consumes: `CHAT_CREATED` pending outbox từ Task 4 và `KafkaEventProducer` hiện có.
- Produces: `claimPendingChatEvents(int batchSize, int maxAttempts)` dùng `FOR UPDATE SKIP LOCKED`; `publishPending(): int`; Kafka record topic `chat.events.v1`, key `serverId`, value `ChatCreatedEnvelope` schema `1`.

**Acceptance Criteria:**
- Success set `PUBLISHED`, `publishedAt` và giữ `attemptCount`; failure tăng attempt, vẫn `PENDING` trước lần 5 và thành `FAILED` ở lần 5.
- Hai publisher không claim cùng row; publisher chỉ claim `CHAT_CREATED`, không vô tình publish notification/invite outbox.
- Kafka unavailable không rollback message đã commit.

- [ ] **Step 1: Viết publisher tests fail** cho envelope exact, topic/key, success, retry, exhausted failure, bounded batch và bỏ qua event type khác.
- [ ] **Step 2: Chạy `cd app/backend && ./gradlew test --tests '*ChatOutboxPublisherTests'`**; expected FAIL vì publisher/claim query chưa có.
- [ ] **Step 3: Thêm native claim query** ordered by `created_at`, status `PENDING`, event type `CHAT_CREATED`, `attempt_count < max`, `FOR UPDATE SKIP LOCKED LIMIT :batchSize`.
- [ ] **Step 4: Đổi `KafkaEventProducer.publish(topic, key, payload)`** để caller chờ broker acknowledgement tối đa 5 giây và nhận exception khi publish fail.
- [ ] **Step 5: Implement `ChatOutboxPublisher.publishPending()`** trong transaction: parse payload, tạo envelope từ outbox metadata, publish, rồi cập nhật status/attempt đúng policy.
- [ ] **Step 6: Bật scheduling** và cấu hình batch `50`, fixed delay `1000ms`, max attempts `5`, topic `chat.events.v1`; scheduler gọi một bounded batch mỗi tick.
- [ ] **Step 7: Thêm create/describe `chat.events.v1`** với 3 partitions, replication factor 1 vào `kafka-init` hiện có.
- [ ] **Step 8: Chạy publisher tests và `./gradlew test`**; expected PASS.
- [ ] **Step 9: Chạy `docker compose up -d kafka kafka-init` rồi `docker compose exec kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server kafka:9092 --describe --topic chat.events.v1`**; expected topic có 3 partitions.
- [ ] **Step 10: Commit** bằng `git commit -m "feat(chat): publish outbox events to kafka"`.

---

### Task 7: Consume Kafka và broadcast `chat-created`

**Files:**
- Create: `app/realtime-gateway/src/messaging/event-deduplicator.ts`
- Create: `app/realtime-gateway/src/messaging/chat-event-consumer.ts`
- Modify: `app/realtime-gateway/main.ts`
- Modify: `app/realtime-gateway/src/health/health-router.ts`
- Test: `app/realtime-gateway/src/messaging/chat-event-consumer.test.ts`

**Interfaces:**
- Consumes: `ChatCreatedEnvelopeSchema`, Socket.IO `io`, `roomName(serverId)`, Kafka config từ Task 1.
- Produces: `ChatEventConsumer.start(): Promise<void>`, `stop(): Promise<void>`, `handleMessage(rawValue, metadata): Promise<'emitted' | 'duplicate' | 'rejected'>`; emit `io.to(serverRoom).emit('chat-created', envelope)`.

**Acceptance Criteria:**
- Valid event được emit đúng room và giữ nguyên persisted IDs/timestamps.
- Malformed/unsupported event được log metadata và reject mà consumer process không crash.
- Cache tối đa 10.000 `eventId`, TTL 10 phút; duplicate trong cache không emit lại; cache không được coi là durability.
- Shutdown ngừng nhận connection, disconnect Kafka rồi close HTTP; readiness false trong startup/shutdown.

- [ ] **Step 1: Viết consumer tests fail** cho valid event, wrong room prevention, malformed JSON, schema version `2`, duplicate event và cache eviction/TTL.
- [ ] **Step 2: Chạy `cd app/realtime-gateway && bun test src/messaging/chat-event-consumer.test.ts`**; expected FAIL vì consumer chưa có.
- [ ] **Step 3: Implement bounded `EventDeduplicator`** với injectable clock cho test, TTL 10 phút và max 10.000 entries.
- [ ] **Step 4: Implement `ChatEventConsumer` bằng KafkaJS**: client/group config, subscribe `fromBeginning: false`, parse/validate, dedup, generated room emit; để KafkaJS commit offset sau handler return.
- [ ] **Step 5: Wire startup/shutdown trong `main.ts`** theo thứ tự config → backend health → HTTP/Socket.IO → Kafka consumer → readiness; xử lý `SIGINT`/`SIGTERM` idempotently.
- [ ] **Step 6: Chạy consumer tests, toàn bộ `bun test`, và `bun run typecheck`**; expected PASS.
- [ ] **Step 7: Commit** bằng `git commit -m "feat(realtime): broadcast kafka chat events"`.

---

### Task 8: Chứng minh luồng end-to-end và ghi runbook tối thiểu

**Files:**
- Create: `app/realtime-gateway/scripts/realtime-smoke.ts`
- Modify: `app/realtime-gateway/README.md`
- Modify: `app/realtime-gateway/.env.example`
- Test: `app/realtime-gateway/scripts/realtime-smoke.ts`

**Interfaces:**
- Consumes: toàn bộ contracts Tasks 1–7 và env `REALTIME_SMOKE_SENDER_TOKEN`, `REALTIME_SMOKE_RECEIVER_TOKEN`, `REALTIME_SMOKE_SERVER_ID`.
- Produces: executable smoke proof cho hai active members và runbook khởi động Kafka → backend → gateway → smoke client.

**Acceptance Criteria:**
- Hai socket join cùng server; sender gửi message và nhận authoritative ACK; cả hai nhận `chat-created` với cùng `messageId`.
- Gửi lại cùng `clientRequestId` trả cùng `messageId`; query DB xác nhận một message và một outbox.
- Khi Kafka dừng, send vẫn ACK và outbox ở `PENDING`; sau Kafka recovery event được publish/broadcast và outbox thành `PUBLISHED`.
- Non-member token không join/send được; output không in token hay full message content.

- [ ] **Step 1: Viết smoke script assertions** với timeout rõ ràng: connect hai client, join, send, đợi ACK/event, retry cùng request ID, so sánh IDs và exit khác 0 khi sai.
- [ ] **Step 2: Bổ sung README runbook** cho config không-secret, apply migration được review, lệnh start ba process và lệnh chạy smoke; ghi rõ prerequisite hai active member tokens.
- [ ] **Step 3: Apply migration bằng credential được cung cấp ngoài git** và query `information_schema` để xác nhận table/index; không copy datasource password vào command history hoặc README.
- [ ] **Step 4: Chạy `docker compose up -d kafka kafka-init`, backend và gateway**; kiểm tra `/live`, `/ready`, Spring internal health và Kafka topic.
- [ ] **Step 5: Chạy `cd app/realtime-gateway && bun run scripts/realtime-smoke.ts`**; expected exit `0`, hai clients nhận cùng persisted message ID, retry giữ nguyên ID.
- [ ] **Step 6: Query PostgreSQL bằng `serverId + senderUserId + clientRequestId`**; expected đúng 1 `chat_message`, 1 `CHAT_CREATED` outbox có status `PUBLISHED`.
- [ ] **Step 7: Chạy failure recovery**: dừng Kafka, send một request ID mới, xác nhận ACK + outbox `PENDING`; start Kafka, xác nhận event đến và status chuyển `PUBLISHED`.
- [ ] **Step 8: Chạy final verification**: `cd app/backend && ./gradlew test`; `cd app/realtime-gateway && bun test && bun run typecheck`.
- [ ] **Step 9: Kiểm tra log redaction** bằng cách search log cho hai raw test tokens và full test message; expected không có match.
- [ ] **Step 10: Commit** bằng `git commit -m "docs(realtime): add end-to-end chat runbook"`.

---

## Definition of Done cho phạm vi này

- Gateway verify RS256/JWKS và Spring xác nhận session/account hiện hành.
- Chỉ active member join được generated room và Spring recheck membership cho mỗi send.
- `chat-send` trả ACK có persisted ID ngay cả khi Kafka tạm unavailable.
- Message/outbox atomic và retry cùng client request chỉ tạo một row/event.
- Outbox publisher retry hữu hạn và publish `chat.events.v1` với key `serverId`.
- KafkaJS consumer validate/dedup/broadcast `chat-created` cho mọi socket trong room.
- Hai-client smoke flow, non-member, duplicate command và Kafka outage/recovery đều được chứng minh.
- Backend tests, gateway tests và typecheck đều pass.

## Deferred sau realtime core

REST chat history/cursor và recovery sau reconnect là phần kế tiếp cần làm trước khi coi toàn bộ Feature 3.1 hoàn chỉnh. Edit/delete, reactions, presence, typing, Redis adapter, multi-instance gateway và UI polish tiếp tục nằm ngoài phạm vi.
