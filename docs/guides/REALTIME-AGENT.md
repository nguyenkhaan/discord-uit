# Realtime Implementation Guide for AI Agents

This document explains how to implement the realtime boundary between the Spring Boot backend and the TypeScript Socket.IO gateway. Read it before changing authentication, chat, outbox, Kafka, or Socket.IO code.

The visual companion is [architect.HTML](./architect.HTML). The functional requirements are in [Phase 03](../plans/phase_03.md), while the broader system decisions are in [architecture.md](../documents/architecture.md).

## 1. Objective

Build an authorized realtime adapter with four implementation tracks:

1. Internal HTTP communication between the gateway and Spring Boot.
2. Asymmetric JWT signing in Spring Boot and public-key verification in the gateway.
3. Socket.IO connection, room authorization, commands, acknowledgements, and broadcasts.
4. Transactional outbox publishing through Kafka and Kafka consumption in the gateway.

The target command/event path is:

```text
React client
  -- Socket.IO command --> TypeScript gateway
  -- internal HTTP -----> Spring Boot
  -- transaction -------> PostgreSQL: domain row + outbox_event
  <-- HTTP ACK ---------- Spring Boot

Spring outbox publisher
  -- Kafka event -------> TypeScript gateway
  -- Socket.IO event ---> server:{serverId}
```

## 2. Non-negotiable boundaries

### Spring Boot owns

- User accounts, sessions, token revocation, and account status.
- Server membership and roles.
- Chat validation, authorization, idempotency, and persistence.
- PostgreSQL transactions.
- Creation of `outbox_event` rows.
- Conversion of outbox rows into versioned Kafka events.

### The realtime gateway owns

- Socket.IO connections and lifecycle.
- Cryptographic access-token verification using a public key.
- Server-generated Socket.IO room names.
- Lightweight payload-shape validation and connection rate limits.
- Forwarding authenticated commands to Spring Boot.
- Consuming Kafka events and broadcasting them to Socket.IO rooms.

### The gateway must never

- Connect directly to PostgreSQL.
- create, edit, or delete chat rows itself.
- Treat JWT claims as proof of current membership.
- Accept a raw room name from a browser.
- Broadcast a chat event before Spring Boot commits the state.
- Reimplement Owner/Member business rules.

Spring Boot must authorize every business command again even if the gateway has already authorized the socket or room.

## 3. Current repository state

Do not confuse the target architecture with what already exists.

Currently present:

- Spring Boot backend in `app/backend`.
- React frontend in `app/frontend`.
- Kafka and `notification.events.v1` in the root `docker-compose.yaml`.
- `OutboxEvent`, `OutboxEventRepository`, and `OutboxStatus` in the backend.
- Active-membership queries in `ServerMembershipRepository`.
- JWT request filtering with session, revocation, and account-status checks.

Currently missing or incomplete:

- `app/realtime-gateway` does not exist.
- There is no general outbox publisher that claims and publishes `PENDING` rows.
- There is no `chat.events.v1` Kafka topic.
- There is no chat domain implementation for Phase 03.
- Access and refresh tokens are still signed with hard-coded HMAC secrets in `JwtUtil`.
- The gateway-specific internal authentication boundary does not exist.

Implement these gaps explicitly. Do not build new code on the assumption that Phase 0.2 is complete.

## 4. Target repository layout

Keep Spring business code inside the existing modular monolith. Add only one new deployable application.

```text
app/
├── backend/
│   └── src/main/java/com/cloudian/backend/
│       ├── modules/chat/
│       ├── modules/realtime/
│       ├── outbox/
│       └── security/
├── frontend/
└── realtime-gateway/
    ├── src/
    │   ├── auth/
    │   ├── backend/
    │   ├── config/
    │   ├── contracts/
    │   ├── health/
    │   ├── messaging/
    │   ├── rate-limit/
    │   ├── socket/
    │   │   └── handlers/
    │   └── main.ts
    ├── tests/
    ├── package.json
    └── tsconfig.json
```

Do not extract the outbox publisher into another deployable service initially. A scheduled Spring component is sufficient for the current scale.

## 5. Communication model

Use different transports for different guarantees.

| Direction | Transport | Purpose | Guarantee |
|---|---|---|---|
| Browser → gateway | Socket.IO | Connection, room requests, chat commands | Immediate acknowledgement |
| Gateway → Spring | Internal HTTPS/JSON | Session validation, membership authorization, domain commands | Synchronous success or error |
| Spring → gateway | Kafka | Persisted domain events | At-least-once delivery |
| Browser → Spring | REST | History and reconnect recovery | Authoritative query |

Do not use Kafka as a request/reply transport for `chat-send`. It would require reply topics, correlation state, and extra timeout handling without improving this project.

## 6. JWT and service authentication

### 6.1 Target signing model

Use RS256 for the first implementation because Java and Node.js support it well.

- Spring Boot stores the RSA private key and signs access tokens.
- Spring Boot exposes the active public keys as JWKS.
- Each token contains a `kid` header identifying the signing key.
- The gateway uses `jose` to fetch/cache JWKS and verify tokens.
- Never copy the private key into the gateway image or repository.
- Never keep production keys in tracked properties files.

Suggested JWKS route:

```text
GET /api/.well-known/jwks.json
```

The gateway must validate at least:

- signature and allowed algorithm (`RS256` only);
- `exp` and `nbf`, when present;
- `iss` and `aud`;
- `sub` as a UUID user ID;
- `sid` as a UUID application-session ID;
- `jti` presence.

Reject algorithm downgrades and tokens with missing required claims.

### 6.2 Cookie and Socket.IO path

The backend currently defaults the access-token cookie path to `/api`. Prefer a same-origin Socket.IO endpoint under that path:

```text
/api/realtime/socket.io
```

This allows the browser to send the HttpOnly access cookie during the Socket.IO handshake without exposing the token to JavaScript. Configure the reverse proxy to route this path to the gateway and configure the Socket.IO server and client with the same custom path.

If an explicit handshake token is used instead, send it in `auth.accessToken`, never in a query string. Query strings are commonly logged.

### 6.3 Why local JWT verification is not enough

A valid signature proves who received the token, not whether the session remains usable. Spring Boot currently also checks:

- JTI revocation;
- the `sid` session still exists, is not revoked, and is not expired;
- the account is still `ACTIVE`;
- current server membership and role.

Therefore:

1. The gateway verifies JWT cryptographically during the Socket.IO handshake.
2. The gateway asks Spring Boot to validate current session/account state.
3. The gateway asks Spring Boot to authorize each room join.
4. Spring Boot revalidates authentication and authorization for every forwarded command.

### 6.4 Gateway-to-Spring trust

Internal endpoints must require both:

- the original user access token; and
- proof that the caller is the realtime gateway.

For local development, use a dedicated service credential from environment configuration, for example `X-Gateway-Token`. Compare it in constant time and never log it. For production, prefer mTLS between the gateway and Spring Boot.

Never accept `X-User-Id` as authentication. The user identity must come from the validated access token.

## 7. Proposed internal HTTP contract

Treat these routes as an implementation contract, not public browser APIs. Document them in OpenAPI and generate or validate TypeScript request/response types.

### Validate a realtime session

```http
POST /api/internal/realtime/session/validate
Authorization: Bearer <user-access-token>
X-Gateway-Token: <service-credential>
```

Successful response:

```json
{
  "userId": "uuid",
  "sessionId": "uuid",
  "accountStatus": "ACTIVE"
}
```

Return `401` for an invalid, expired, or revoked session. Do not reveal which validation check failed.

### Authorize a server room

```http
POST /api/internal/realtime/servers/{serverId}/authorize
Authorization: Bearer <user-access-token>
X-Gateway-Token: <service-credential>
```

Successful response:

```json
{
  "serverId": "uuid",
  "userId": "uuid",
  "role": "MEMBER"
}
```

Authorize only when `server_membership.left_at IS NULL` and the server is not deleted. Prefer a non-enumerating `404` for users who are not active members, matching the existing `ServerAccessGuard` behavior.

### Create a chat message

```http
POST /api/internal/realtime/servers/{serverId}/messages
Authorization: Bearer <user-access-token>
X-Gateway-Token: <service-credential>
Content-Type: application/json
```

```json
{
  "clientRequestId": "uuid",
  "contentText": "Hello"
}
```

Spring Boot must:

1. Revalidate the user and active membership.
2. Enforce message size and domain limits.
3. Insert `chat_message` and `outbox_event` in one transaction.
4. Enforce unique `(server_id, sender_user_id, client_request_id)`.
5. On an idempotent retry, return the already persisted message.
6. Return only after the database transaction commits.

The HTTP response becomes the Socket.IO acknowledgement to the sender. Kafka is not in the synchronous acknowledgement path.

## 8. Socket.IO contract

Use explicit versioned TypeScript types and runtime validation. TypeScript types alone do not validate untrusted payloads. A small schema library such as Zod is appropriate at the gateway boundary.

### Connection

- Path: `/api/realtime/socket.io`.
- Transport: WebSocket with normal Socket.IO fallback when required.
- Credentials: enabled for the same-origin HttpOnly cookie flow.
- CORS: explicit frontend origin only; never wildcard with credentials.
- Store the verified `userId`, `sessionId`, raw access token, and authorized server IDs in `socket.data`.

### Client-to-gateway events

#### `server-join`

```ts
type ServerJoinCommand = {
  serverId: string;
};
```

The handler calls Spring authorization and then joins the generated room `server:${serverId}`. The client never supplies that room string.

#### `server-leave`

```ts
type ServerLeaveCommand = {
  serverId: string;
};
```

#### `chat-send`

```ts
type ChatSendCommand = {
  serverId: string;
  clientRequestId: string;
  contentText: string;
};
```

The gateway validates shape and size, applies a connection/user rate limit, and forwards the command to Spring Boot.

### Acknowledgement envelope

Every command callback should use one stable envelope:

```ts
type SocketAck<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
        retryable: boolean;
      };
    };
```

Do not expose Spring stack traces, database errors, internal URLs, or token-validation details.

Suggested stable codes include:

- `UNAUTHENTICATED`;
- `NOT_A_MEMBER`;
- `INVALID_PAYLOAD`;
- `RATE_LIMITED`;
- `BACKEND_UNAVAILABLE`;
- `INTERNAL_ERROR`.

### Gateway-to-client events

The initial Phase 03 event is `chat-created`. Its payload must contain the persisted message ID, server ID, sender ID, content, client request ID, and authoritative creation time.

The sender receives both:

- a direct command acknowledgement; and
- the same `chat-created` room event as every other member.

The frontend reconciles optimistic state by `clientRequestId` and then by persisted message ID.

## 9. Transactional outbox

The chat transaction must save the domain change and outbox row atomically:

```text
BEGIN
  INSERT chat_message ...
  INSERT outbox_event ... status = PENDING
COMMIT
```

If either insert fails, both must roll back.

Implement a Spring outbox publisher that:

1. Claims a bounded batch of `PENDING` rows without allowing two workers to claim the same row.
2. Publishes each row to the mapped Kafka topic.
3. Marks successful rows `PUBLISHED` and sets `published_at`.
4. Increments `attempt_count` after a failed attempt.
5. Retries with bounded backoff.
6. Marks exhausted rows `FAILED` and emits an operational alert or error metric.

Use database locking appropriate for PostgreSQL, such as `FOR UPDATE SKIP LOCKED`, when concurrent publisher instances are possible.

Do not claim exactly-once delivery. The system is at-least-once; consumers must tolerate duplicates.

## 10. Kafka contract

### Topic

```text
chat.events.v1
```

Use `serverId` as the Kafka message key so events for one server remain ordered within one partition.

Add the topic to `docker-compose.yaml` through the existing `kafka-init` service. Do not rely on broker auto-topic creation.

### Event envelope

Use one versioned envelope for all chat events:

```json
{
  "schemaVersion": 1,
  "eventId": "outbox-event-uuid",
  "eventType": "CHAT_CREATED",
  "occurredAt": "2026-11-04T08:00:00Z",
  "aggregateType": "CHAT_MESSAGE",
  "aggregateId": "message-uuid",
  "serverId": "server-uuid",
  "data": {
    "messageId": "message-uuid",
    "senderUserId": "user-uuid",
    "clientRequestId": "request-uuid",
    "contentText": "Hello",
    "createdAt": "2026-11-04T08:00:00Z"
  }
}
```

Rules:

- `eventId` is the outbox row ID and is the deduplication key.
- `occurredAt` and message timestamps are ISO-8601 UTC instants.
- Validate the envelope at both producer and consumer boundaries.
- Never include access tokens, session IDs, email addresses, or unnecessary private data.
- Deleted-message events must not include deleted content.
- Breaking schema changes require a new schema or topic version.

### Gateway consumer

Use KafkaJS in the TypeScript gateway.

For one gateway instance:

- consume `chat.events.v1`;
- validate each event;
- derive `server:${serverId}` internally;
- emit the mapped Socket.IO event;
- commit the offset after handing the event to Socket.IO;
- log event metadata, not private message content.

A crash may cause a duplicate event after restart. This is acceptable because clients reconcile by `eventId`, `messageId`, and `clientRequestId`.

For multiple gateway instances, add the Socket.IO Redis adapter and use one Kafka consumer group. The consuming gateway emits once, and the Redis adapter fans the event across sockets connected to every gateway instance. Do not add Redis before multi-instance deployment is required.

## 11. Failure and recovery behavior

### Spring Boot is unavailable

- Keep the socket connection if appropriate, but fail commands with `BACKEND_UNAVAILABLE`.
- Set `retryable: true`.
- Do not fabricate a successful acknowledgement.

### Kafka is unavailable

- The chat transaction still commits with a `PENDING` outbox row.
- The publisher retries later.
- The sender already has the persisted message through the HTTP acknowledgement.
- Other clients recover through REST history after reconnect or refresh.

### Gateway restarts

- Socket.IO clients reconnect with backoff.
- Clients re-request room membership after reconnect.
- Clients reload chat history using the last persisted cursor.
- Never rely on gateway memory as the only record of authorization or delivery.

### Membership is revoked while connected

Spring rejects subsequent commands even if the socket remains in a room. Later, publish a membership-ended event so the gateway can remove active sockets from that server room immediately. This event is useful but does not replace Spring-side command authorization.

## 12. Configuration

Validate configuration at startup and fail fast when required values are missing.

Suggested gateway environment variables:

```text
NODE_ENV
PORT
FRONTEND_ORIGIN
SOCKET_IO_PATH=/api/realtime/socket.io
SPRING_BASE_URL
GATEWAY_SERVICE_TOKEN
JWT_ISSUER
JWT_AUDIENCE
JWT_JWKS_URL
KAFKA_BROKERS
KAFKA_CLIENT_ID
KAFKA_GROUP_ID
CHAT_EVENTS_TOPIC=chat.events.v1
```

Suggested Spring configuration:

```text
APP_JWT_PRIVATE_KEY
APP_JWT_PUBLIC_KEY
APP_JWT_KEY_ID
APP_JWT_ISSUER
APP_JWT_AUDIENCE
APP_GATEWAY_SERVICE_TOKEN
SPRING_KAFKA_BOOTSTRAP_SERVERS
```

Use secret files or a secret manager outside local development. Do not commit real keys or service tokens.

## 13. Observability and safe logging

Include structured fields where useful:

- `eventId`;
- `clientRequestId`;
- `messageId`;
- `serverId`;
- `userId`;
- Socket.IO connection ID;
- Kafka topic, partition, and offset;
- internal request correlation ID.

Never log:

- raw JWTs or cookies;
- private or public keys;
- gateway service credentials;
- complete private message content;
- passwords or refresh tokens.

Expose separate liveness and readiness endpoints from Express. Readiness should reflect whether the process can accept sockets and whether required startup dependencies/configuration were initialized. A transient Kafka publish backlog should be visible through metrics without necessarily killing liveness.

## 14. Implementation order

Follow this order to keep each step testable:

1. Define HTTP, Socket.IO, and Kafka contracts and fixtures.
2. Replace HMAC JWT signing with RS256 and add JWKS plus key-rotation support.
3. Add gateway service authentication and Spring internal realtime endpoints.
4. Implement chat persistence and atomic outbox writing.
5. Implement and test the Spring outbox publisher.
6. Add `chat.events.v1` to local Kafka initialization.
7. Scaffold the TypeScript gateway with validated configuration and health endpoints.
8. Implement Socket.IO authentication and authorized room handlers.
9. Implement `chat-send` forwarding and acknowledgement mapping.
10. Implement the Kafka consumer and `chat-created` broadcast.
11. Add frontend connection/reconnect and REST recovery behavior.
12. Run end-to-end failure, retry, duplicate, and authorization tests.

Do not begin with UI chat components. Prove the transport and authorization path first.

## 15. Required tests

### Spring Boot

- JWTs are signed with the private key and verified with the public key.
- Unknown `kid`, wrong issuer/audience, invalid signature, and expired tokens fail.
- Internal routes reject missing or invalid gateway credentials.
- Non-members cannot authorize a room or send a message.
- Domain state and outbox state commit or roll back together.
- Two requests with the same `(serverId, senderUserId, clientRequestId)` create one message.
- An idempotent retry returns the original persisted message.
- Publisher retry increments `attempt_count`; exhausted events become `FAILED`.

### Gateway

- Invalid or missing JWT rejects the Socket.IO handshake.
- A revoked/invalid session reported by Spring rejects the connection.
- The browser cannot join an arbitrary room.
- A non-member cannot join `server:{serverId}`.
- Invalid payloads never reach Spring Boot.
- Spring errors map to stable, sanitized Socket.IO acknowledgements.
- Duplicate Kafka events do not break client state.
- Malformed or unsupported Kafka event versions are rejected and observable.

### Integration

- A persisted message produces a `chat-created` event with the same message ID.
- A rolled-back transaction produces no realtime event.
- A gateway restart does not lose durable chat state.
- Kafka downtime leaves an outbox backlog that publishes after recovery.
- Reconnect triggers REST history recovery.
- Logging contains correlation metadata but no token or message-content leakage.

## 16. Definition of done for the realtime core

The core is complete only when all of the following are demonstrated:

- Spring Boot signs access tokens asymmetrically; the gateway has no private signing material.
- A valid active user can establish an authenticated Socket.IO connection.
- Only an active server member can join the generated server room.
- `chat-send` persists through Spring Boot and returns an authoritative acknowledgement.
- The message and outbox row are atomic.
- Kafka delivers `chat-created` to the gateway after commit.
- Every connected member in the room receives the persisted message ID.
- Duplicate command retries create one database row.
- Duplicate Kafka delivery is harmless.
- Reconnect recovery works through REST history.
- Relevant backend, gateway, and integration tests pass.

## 17. Out of scope for the first slice

Do not add these until the core path above works:

- Chat editing and deletion.
- Message reactions.
- Presence indicators and typing indicators.
- Multi-instance Socket.IO Redis adapter.
- LiveKit call signaling.
- Full chat UI polish.
- Kafka-based command/reply.
- A separate outbox microservice.

These features may reuse the transport later, but they must not complicate the first authenticated `chat-send` → persisted event → `chat-created` slice.
