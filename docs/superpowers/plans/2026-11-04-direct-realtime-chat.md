# Direct Realtime Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hoàn thành luồng chat đã xác thực và authorize qua một Socket.IO gateway: persist `chat_message` idempotently trong Spring, ACK sender bằng DTO authoritative và broadcast trực tiếp `chat-created` cho room.

**Architecture:** Gateway verify access token bằng JWKS rồi nhờ Spring xác nhận session và membership. Spring là nguồn sự thật cho identity, authorization và persistence; sau REST thành công, gateway dùng DTO đã persist để ACK và emit trực tiếp tới generated room `server:{serverId}`. Kafka và outbox được hoãn.

**Tech Stack:** Java 17, Spring Boot 4.1.1, Spring Security/Data JPA, PostgreSQL/Supabase, Bun + TypeScript, Express, Socket.IO, `jose`, Zod, JUnit 5, Bun test.

**Spec:** `docs/superpowers/specs/2026-11-04-direct-realtime-chat-design.md`

## Global Constraints

- Gateway không đọc/ghi PostgreSQL và không tự quyết định membership.
- Internal user REST luôn cần cả bearer access token và `X-Gateway-Token`; không nhận user ID từ gateway.
- Gateway chỉ chấp nhận JWT `RS256` có đúng `iss`, `aud`, `exp`, `sub`, `sid`, `jti` và `kid`, rồi vẫn gọi Spring validate session.
- Socket.IO path là `/api/realtime/socket.io`; token ưu tiên HttpOnly cookie `access_token`, fallback `handshake.auth.accessToken`, không dùng query string.
- Client chỉ gửi UUID `serverId`; gateway tự tạo room `server:{serverId}`.
- `contentText` sau trim dài 1–2.000 ký tự; giới hạn 5 lần gửi trong 10 giây mỗi user/process.
- Idempotency key là `(server_id, sender_user_id, client_request_id)`.
- Spring recheck active membership cho mỗi `chat-send`, kể cả socket đã join.
- Chỉ hỗ trợ một gateway instance; không Redis adapter, Kafka hoặc outbox trong plan này.
- Không log token, cookie, gateway token, key material hoặc toàn bộ nội dung chat.
- Test gateway nằm dưới `app/realtime-gateway/tests/`.

## Review Focus

- Session bị revoke sau khi JWT được ký phải bị từ chối ở handshake.
- Membership bị thu hồi sau khi join phải khiến lần gửi tiếp theo trả `NOT_A_MEMBER`.
- Hai request đồng thời cùng idempotency key phải trả cùng message và chỉ tạo một row.
- Gateway chết sau DB commit nhưng trước emit không được làm mất row; realtime recovery được ghi rõ là deferred.
- Backend timeout/5xx không được tạo ACK thành công hoặc broadcast message chưa xác nhận.

## Contract

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
```

Stable errors: `UNAUTHENTICATED`, `NOT_A_MEMBER`, `INVALID_PAYLOAD`, `RATE_LIMITED`, `BACKEND_UNAVAILABLE`, `INTERNAL_ERROR`.

## Dependency Graph

```text
Task 1 contracts/config/server
  -> Task 2 authenticated socket
      -> Task 3 authorized room
          -> Task 4 idempotent chat persistence
              -> Task 5 direct ACK + room broadcast
                  -> Task 6 smoke proof
```

---

### Task 1: Contracts, non-Kafka config and server shell

**Files:**
- Modify: `app/realtime-gateway/src/config/env.ts`
- Modify: `app/realtime-gateway/.env.example`
- Create: `app/realtime-gateway/src/contracts/realtime.ts`
- Create: `app/realtime-gateway/src/health/health-router.ts`
- Create: `app/realtime-gateway/src/socket/create-socket-server.ts`
- Modify: `app/realtime-gateway/main.ts`
- Test: `app/realtime-gateway/tests/config/env.test.ts`
- Test: `app/realtime-gateway/tests/contracts/realtime.test.ts`
- Test: `app/realtime-gateway/tests/health/health-router.test.ts`

**Interfaces:**
- Consumes: existing `BackendClient.checkInternalHealth()`.
- Produces: `GatewayConfig` without Kafka settings; command/DTO/ACK contracts; `createSocketServer(config)` returning `{ httpServer, io, readiness }`.

**Acceptance Criteria:**
- Config has no unused Kafka/outbox requirement.
- Invalid UUID, blank content and content over 2.000 chars are rejected; successful parse returns trimmed command content.
- `/live` always returns `200`; `/ready` returns `503` before readiness and `200` after startup dependencies initialize.
- Socket.IO uses the fixed path and exact credentialed frontend origin.

- [ ] **Step 1:** Update config tests to remove Kafka fields and assert JWT/frontend/socket/chat-limit config.
- [ ] **Step 2:** Remove Kafka config from `GatewayConfig`, `.env.example` and package dependencies; run config tests and typecheck.
- [ ] **Step 3:** Implement command, DTO and ACK contracts; run contract tests.
- [ ] **Step 4:** Write failing health/server tests for liveness, readiness transition, Socket.IO path and CORS.
- [ ] **Step 5:** Implement health router, readiness state and Socket.IO server shell.
- [ ] **Step 6:** Compose config, backend health and server startup in `main.ts`; do not register auth/handlers yet.
- [ ] **Step 7:** Run `bun test`, `bun run typecheck`, and `bun run format:check`.
- [ ] **Step 8:** Commit `feat(realtime): bootstrap direct socket gateway`.

---

### Task 2: Authenticate Socket.IO with JWKS and current Spring session

**Files:**
- Modify: `app/backend/src/main/java/com/cloudian/backend/filters/JwtRequestFilter.java`
- Create: `app/backend/src/main/java/com/cloudian/backend/modules/realtime/dto/RealtimeSessionResponse.java`
- Modify: `app/backend/src/main/java/com/cloudian/backend/modules/realtime/RealtimeInternalController.java`
- Create: `app/realtime-gateway/src/auth/access-token.ts`
- Create: `app/realtime-gateway/src/auth/jwt-verifier.ts`
- Create: `app/realtime-gateway/src/auth/socket-auth.ts`
- Modify: `app/realtime-gateway/src/backend/backend-client.ts`
- Modify: `app/realtime-gateway/src/socket/create-socket-server.ts`
- Test: backend JWT/controller tests and `app/realtime-gateway/tests/auth/socket-auth.test.ts`.

**Interfaces:**
- Consumes: Task 1 config/server.
- Produces: `POST /api/internal/realtime/session/validate`; `verifyAccessToken(token)`; `BackendClient.validateSession(token)`; authenticated `socket.data.auth`.

**Acceptance Criteria:**
- Missing/invalid JWT or required claim returns sanitized `connect_error`.
- A correctly signed token whose Spring session is revoked is rejected.
- Raw access token is retained only in socket auth state for internal calls and is never logged.

- [ ] Write backend failing tests for session request attribute and validate endpoint.
- [ ] Implement the request attribute and validate endpoint; run backend tests.
- [ ] Write gateway handshake tests using test RSA/JWKS and fake Spring.
- [ ] Implement cookie/auth extraction, JWKS verification and Socket.IO middleware.
- [ ] Run focused tests, full relevant suites and typecheck.
- [ ] Commit `feat(realtime): authenticate socket sessions`.

---

### Task 3: Authorize generated server rooms

**Files:**
- Create: backend realtime authorization service/DTO and tests.
- Modify: backend realtime controller.
- Modify: gateway backend client and socket server.
- Create: `app/realtime-gateway/src/socket/room-name.ts`.
- Create: `app/realtime-gateway/src/socket/server-room-handlers.ts`.
- Test: `app/realtime-gateway/tests/socket/server-room-handlers.test.ts`.

**Interfaces:**
- Consumes: authenticated socket and `ServerMembershipRepository.findActiveRole(serverId, userId)`.
- Produces: internal authorize endpoint, `roomName(serverId)`, `server-join` and `server-leave` handlers.

**Acceptance Criteria:**
- Only active members join `server:{validatedUuid}`.
- Non-member/deleted server maps non-enumerating Spring `404` to `NOT_A_MEMBER`.
- Leave removes room and `authorizedServerIds` state.

- [ ] Write and run failing backend authorization tests.
- [ ] Implement service and internal endpoint; run backend tests.
- [ ] Write and run failing gateway room tests.
- [ ] Implement backend call, room-name generation and handlers.
- [ ] Run gateway suite/typecheck and commit `feat(realtime): authorize server socket rooms`.

---

### Task 4: Persist chat messages idempotently

**Files:**
- Create: `app/backend/src/main/resources/db/migration/V20261104_01__create_chat_message.sql`.
- Modify/create: chat entity, repository, DTO, writer and command service as required by the existing model.
- Modify: realtime internal controller.
- Test: chat command unit tests and PostgreSQL persistence integration tests.

**Interfaces:**
- Consumes: Task 3 active-membership policy.
- Produces: `POST /api/internal/realtime/servers/{serverId}/messages` and `createOrGet(serverId, senderUserId, request): ChatMessageResponse`.

**Acceptance Criteria:**
- Active member creates one persisted message; non-member receives non-enumerating `404`.
- Sequential and concurrent duplicate keys return the same row.
- Blank/over-limit content creates no row.
- No `outbox_event` is written in this plan.

- [ ] Review existing `ChatMessage` model/schema and write the migration for the required fields and unique key.
- [ ] Write failing unit tests for create, membership, validation and sequential idempotency.
- [ ] Write failing PostgreSQL integration test for concurrent idempotency.
- [ ] Implement minimal entity/repository/DTO/writer/service and endpoint.
- [ ] Run focused and full backend tests.
- [ ] Commit `feat(chat): persist idempotent realtime messages`.

---

### Task 5: Forward chat commands and broadcast persisted DTOs directly

**Files:**
- Modify: `app/realtime-gateway/src/backend/backend-client.ts`.
- Create: `app/realtime-gateway/src/socket/chat-rate-limiter.ts`.
- Create: `app/realtime-gateway/src/socket/socket-error-mapper.ts`.
- Create: `app/realtime-gateway/src/socket/chat-handlers.ts`.
- Modify: socket server.
- Test: `app/realtime-gateway/tests/socket/chat-handlers.test.ts`.

**Interfaces:**
- Consumes: Tasks 1–4 contracts, auth state, authorized room state and message endpoint.
- Produces: `BackendClient.createChatMessage(...)`; `registerChatHandlers(socket, io, backendClient, limiter)`; ACK and direct `chat-created` event containing the persisted `ChatMessageDto`.

**Acceptance Criteria:**
- Gateway validates payload, joined state and rate limit before calling Spring.
- On Spring success, ACK and broadcast use exactly the returned DTO; no client-supplied ID/timestamp is broadcast.
- Spring `404` after prior join maps to `NOT_A_MEMBER` and does not broadcast.
- Timeout/5xx maps to retryable `BACKEND_UNAVAILABLE` and does not broadcast.
- Callback executes once; idempotent retry ACKs the same ID and may emit the same DTO in this single-instance phase.

- [ ] Write failing tests for success ACK+broadcast, invalid/not joined/rate limited, revoked membership and backend failures.
- [ ] Refactor backend client to a timed typed JSON request primitive.
- [ ] Implement bounded per-user rate limiter and error mapper.
- [ ] Implement chat handler: validate -> joined check -> rate limit -> Spring -> ACK -> room emit.
- [ ] Run gateway tests/typecheck/format check.
- [ ] Commit `feat(realtime): broadcast persisted chat messages directly`.

---

### Task 6: Prove the direct two-client flow

**Files:**
- Create: `app/realtime-gateway/scripts/realtime-smoke.ts`.
- Modify: gateway README and `.env.example`.

**Interfaces:**
- Consumes: Tasks 1–5.
- Produces: two-client smoke proof and runbook.

**Acceptance Criteria:**
- Two active members join; sender ACK and both `chat-created` events contain the same persisted ID.
- Retry with the same client request ID returns the same message ID and DB contains one row.
- Non-member cannot join/send.
- Output/logs contain no token or full chat content.

- [ ] Implement smoke assertions with bounded timeouts.
- [ ] Document migration/startup/smoke commands and the direct-broadcast failure window.
- [ ] Run two-client, retry and non-member proofs; query one matching DB row.
- [ ] Run final backend tests, gateway tests, typecheck and format check.
- [ ] Commit `docs(realtime): add direct chat smoke runbook`.

## Deferred Kafka Phase

Add transactional outbox, publisher retry, Kafka topic and gateway consumer in a separate plan. When enabled, remove direct emit from Task 5 so a persisted message has one broadcast path.
