# Feature-Driven Implementation Plan

## Phase 0 — Engineering foundation and reliable delivery

### Feature 0.1 — Runnable application shell and shared contracts

**Outcome:** BE, FE, PostgreSQL, RabbitMQ, and test tooling run predictably before domain work begins.

#### Step 0.1.1 — BE foundation

- Add Flyway, PostgreSQL Testcontainers, validation, and required static-analysis configuration to `app/backend/build.gradle`.
- Organize BE by feature under `com.cloudian.backend.modules`; use controller → application service → repository boundaries and immutable request/response records.
- Move JWT keys and external-service settings out of `JwtUtil` into validated environment-backed configuration. Replace the hard-coded `CustomUserDetailsService` implementation with a repository-backed boundary in Phase 1.
- Stabilize the shared error contract with `code`, `message`, `status`, `timestamp`, `path`, and field-validation errors while retaining the existing exception handler behavior.
- Add a PostgreSQL/RabbitMQ local profile to `app/backend/compose.yaml`, health/readiness checks, and configuration validation.
- Verify: `cd app/backend && ./gradlew test` passes.

#### Step 0.1.2 — FE foundation

- Replace the Vite demo with an application shell in `app/frontend/src` containing public, authenticated-user, and admin layouts.
- Add routing, a typed HTTP client, server-state/query handling, a single session store, form validation, error boundary, toast/notification surface, and responsive navigation.
- Standardize on one package manager; use npm because `package-lock.json` exists, and remove the competing lockfile as part of the implementation change.
- Add Vitest/React Testing Library and Playwright scripts; preserve strict TypeScript and ESLint checks.
- Verify: `cd app/frontend && npm ci && npm run lint && npm run build && npm test -- --run` passes.

#### Step 0.1.3 — Integration

- Configure the FE API base URL and CORS for local/staging environments; call `/api/health` from a status screen.
- Generate or validate FE API types from `/api/docs/openapi` in CI.
- Add one smoke test that starts the stack and verifies FE → `/api/health` → BE.
- Acceptance: the stack starts from documented commands, shows a healthy state, and renders the shared error UI for an unavailable API.

### Feature 0.2 — Transactional outbox and realtime transport

**Outcome:** later features can deliver events without broadcasting uncommitted state.

#### Step 0.2.1 — BE/realtime foundation

- Create `outbox_event` with `id`, `entity_type`, `entity_id`, `event_type`, `payload`, `status`, `created_at`, `published_at`, and `attempt_count`.
- Add an outbox publisher that claims `PENDING` rows, publishes through RabbitMQ, sets `status = PUBLISHED` and `published_at`, and retries by incrementing `attempt_count`; move exhausted items to `FAILED` with operational alerts.
- Add a Socket.IO gateway under `app/realtime-gateway` as the authorized realtime adapter described by the architecture. It must accept only server-generated room names such as `user:{userId}` and `server:{serverId}`.
- Test atomic rollback: domain change and `outbox_event` must both commit or both roll back.

#### Step 0.2.2 — FE realtime client

- Add one authenticated Socket.IO client with reconnect/backoff, connection status, event de-duplication, and clean session teardown.
- Route user-room events into the query cache/store; do not duplicate feature business rules in the socket layer.
- Add a visible reconnect state and an accessible retry action.

#### Step 0.2.3 — Integration

- Publish a non-sensitive test event through `outbox_event`, RabbitMQ, the gateway, and the authenticated FE client.
- Verify duplicate delivery is harmless and reconnect triggers a REST refresh.
- Acceptance: only the addressed user receives the event, unauthorized room subscription fails, and no event appears after a rolled-back transaction.

### Checkpoint — Foundation

- `./gradlew test`, FE lint/build/tests, gateway tests, and the stack smoke test pass.
- No hard-coded credential remains in tracked application code.
- OpenAPI and shared error contracts are versioned and consumed by FE.

## Phase 1 — Identity, accounts, and sessions

### Feature 1.1 — Personal registration, email verification, and profile

**User stories:** AUTH-03, AUTH-04, AUTH-08.

**Database:** `user_account(id, email, password_hash, account_type, account_status, email_verified_at, uit_subject, full_name, system_role, created_at, updated_at)` and `account_token(id, user_id, token_hash, purpose, expires_at, consumed_at, created_at)`.

#### Step 1.1.1 — BE

- Migrate `user_account` and `account_token` with foreign keys and checks: `PERSONAL` requires `password_hash` and null `uit_subject`; `UIT` requires `uit_subject` and null `password_hash`.
- Implement personal registration that rejects `@uit.edu.vn`, normalizes `email`, hashes the password, creates `account_type = PERSONAL`, `account_status = UNVERIFIED`, and `system_role = USER`.
- Issue a one-use `account_token` with `purpose = EMAIL_VERIFICATION`; store only `token_hash`, enforce `expires_at`, and set `consumed_at` plus `user_account.email_verified_at` and `account_status = ACTIVE` atomically.
- Implement `GET/PATCH /api/me`; initially allow only `full_name` changes and update `updated_at`.
- Test duplicate email, UIT-domain rejection, expired/consumed token, and inactive-account authorization.

#### Step 1.1.2 — FE

- Build registration, verification-result, and profile pages using fields that map to `user_account.email` and `user_account.full_name`.
- Provide accessible password rules, resend-verification feedback, and explicit `UNVERIFIED`, `ACTIVE`, and `BANNED` states.
- Do not expose `password_hash`, `token_hash`, `system_role` mutation, or internal IDs unnecessarily.

#### Step 1.1.3 — Integration

- Connect register → email-provider stub → verify → profile update.
- Confirm the database changes `user_account.account_status` from `UNVERIFIED` to `ACTIVE`, sets `email_verified_at`, and marks `account_token.consumed_at` once.
- Acceptance: an unverified account cannot access main routes; a verified account can; a replayed verification token fails safely.

### Feature 1.2 — Login, refresh rotation, logout, and authorization context

**User stories:** AUTH-02 and the shared session behavior required by all protected stories.

**Database:** `user_account(id, email, account_status, system_role)` and `refresh_session(id, user_id, token_hash, expires_at, revoked_at, created_at)`.

#### Step 1.2.1 — BE

- Replace username/prototype authentication with `user_account.email` lookup and password verification for `account_type = PERSONAL`.
- Implement `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout`, and `/api/auth/logout-all`.
- On login create `refresh_session` with hashed rotating token data; on refresh revoke the old row through `revoked_at` and create the replacement transactionally; reject expired or reused sessions.
- Put `user_account.id`, `system_role`, and session/version claims in the access-token security context, then re-check `account_status = ACTIVE` for protected requests.
- Return a generic authentication failure for unknown email, incorrect password, `UNVERIFIED`, and `BANNED` accounts where disclosure would be unsafe.

#### Step 1.2.2 — FE

- Build login/logout flows and session restoration without persisting raw refresh tokens in JavaScript-readable storage; prefer secure cookie transport for refresh.
- Add authenticated and admin route guards based on `/api/me`, while treating BE authorization as authoritative.
- On refresh failure, clear cached private data and return to login with a non-sensitive reason.

#### Step 1.2.3 — Integration

- Connect login, automatic access-token refresh, logout, and logout-all across multiple browser sessions.
- Verify each refresh rotates `refresh_session.token_hash`, sets the previous `revoked_at`, and prevents reuse.
- Acceptance: `ACTIVE` users enter the app, `UNVERIFIED`/`BANNED` users cannot, and `system_role = ADMIN` alone unlocks admin APIs.

### Feature 1.3 — Password reset/change and email change

**User stories:** AUTH-05, AUTH-06, AUTH-07.

**Database:** `account_token.purpose` values `PASSWORD_RESET` and `EMAIL_CHANGE`; `user_account.email`, `password_hash`, `account_status`, `email_verified_at`, `updated_at`; all active `refresh_session.revoked_at` rows for the user.

#### Step 1.3.1 — BE

- Add request/confirm endpoints for password reset with a generic request response; enforce one-use `token_hash`, `expires_at`, and `consumed_at`.
- Add authenticated password change requiring current-password verification.
- Add email-change request/confirm; reject `@uit.edu.vn`, reserve the new unique email safely, then update `user_account.email`, clear `email_verified_at`, and set `account_status = UNVERIFIED` until confirmation.
- After password or email credential changes, set `revoked_at` on every live `refresh_session` for `user_id`.

#### Step 1.3.2 — FE

- Build forgot/reset-password, change-password, and change-email forms with success states that do not reveal account existence.
- After a credential change, clear the session and show the required re-verification/re-login action.

#### Step 1.3.3 — Integration

- Exercise each email link once, then replay and expire it.
- Verify `account_token.purpose`, `consumed_at`, account fields, and revoked sessions.
- Acceptance: credential changes invalidate old refresh tokens; email change blocks main features until the new email is verified.

### Feature 1.4 — UIT SSO

**User story:** AUTH-01.

**Database:** `user_account.account_type = UIT`, `uit_subject`, `email`, `password_hash = null`, `account_status`, `email_verified_at`, `full_name`, and the same `refresh_session` lifecycle.

#### Step 1.4.1 — BE

- Implement authorization-code SSO with state/nonce and callback validation against the official UIT provider configuration.
- Upsert by immutable `user_account.uit_subject`, validate the returned `@uit.edu.vn` email, never store the UIT password, and create/update the local profile.
- Issue the same application access/refresh session as personal login. Define safe behavior for changed UIT email and banned local accounts.

#### Step 1.4.2 — FE

- Add “Continue with UIT” to login, an SSO callback page, cancel/error handling, and the same post-login session bootstrap.

#### Step 1.4.3 — Integration

- Test against the provider sandbox or a protocol-faithful stub for success, invalid state/nonce, callback replay, changed email, and `BANNED` account.
- Acceptance: one `uit_subject` maps to one `user_account`, `password_hash` stays null, and app tokens—not UIT credentials—authorize application features.

### Checkpoint — Identity

- AUTH-01 through AUTH-08 pass end to end.
- Authentication, account-status, and `system_role` authorization tests pass.
- The OpenAPI session contract contains no password hashes or raw durable token values.

## Phase 2 — Notifications, private servers, invitations, and membership

### Feature 2.1 — In-app notification center and admin message

**User stories:** NOTI-01, NOTI-02, NOTI-03.

**Database:** `notification(id, recipient_user_id, actor_user_id, kind, content, related_entity_type, related_entity_id, read_at, deleted_at, created_at)` plus `outbox_event`.

#### Step 2.1.1 — BE

- Migrate `notification` and implement paginated list, unread count, mark-read, and soft-delete scoped to `recipient_user_id`.
- Implement admin-only one-way messages using `kind = ADMIN_MESSAGE`, `actor_user_id` as the admin, and the target account as `recipient_user_id`.
- Create notification and `outbox_event` atomically; never return rows with `deleted_at` in the normal list.

#### Step 2.1.2 — FE

- Build the bell/unread badge, notification center, read/delete actions, and an admin send-message form.
- Render `kind`, `content`, and safe links from `related_entity_type`/`related_entity_id`; do not infer access from the link.

#### Step 2.1.3 — Integration

- Connect REST initial load and `user:{userId}` realtime updates; de-duplicate by `notification.id`.
- Acceptance: only `recipient_user_id` sees the row, deletion sets `deleted_at`, and an `ADMIN_MESSAGE` cannot be replied to as a direct message.

### Feature 2.2 — Create, list, view, and update private servers

**User story:** SRV-01.

**Database:** `server(id, name, group_image_url, created_by_user_id, created_at, updated_at, deleted_by_user_id, deleted_at, deletion_reason)` and `server_membership(id, user_id, server_id, role, joined_at, left_at, ended_reason, ended_by_user_id)`.

#### Step 2.2.1 — BE

- Migrate both tables and a partial unique index allowing only one `server_membership` with `left_at IS NULL` per `(server_id, user_id)`.
- In one transaction, create `server` and the creator membership with `role = OWNER`.
- Implement member-scoped server list/detail and owner-scoped update of `server.name` and `server.group_image_url`; exclude `server.deleted_at` rows.
- Validate that server images use an approved uploaded object or approved URL policy; do not trust arbitrary browser-supplied URLs.

#### Step 2.2.2 — FE

- Build server create form, private server switcher/list, detail shell, and owner settings.
- Show role from active `server_membership.role`; hide owner controls for usability but handle BE `403` responses.

#### Step 2.2.3 — Integration

- Connect create → list → detail → rename/image update.
- Verify one `server` and one active `OWNER` `server_membership` are created atomically.
- Acceptance: non-members cannot discover the server; members see only servers where their membership has `left_at = null`.

### Feature 2.3 — Direct invitations and expiring invite links

**User stories:** SRV-02, SRV-03, SRV-04, SRV-05.

**Database:** `server_invite(id, server_id, created_by_user_id, recipient_user_id, token_hash, invite_type, status, expires_at, max_uses, use_count, created_at, accepted_at, declined_at, revoked_at)`, `notification.kind = SERVER_INVITATION`, `server_membership`, and `outbox_event`.

#### Step 2.3.1 — BE

- Migrate `server_invite` checks: `DIRECT` requires `recipient_user_id`; `LINK` requires `token_hash`, positive `max_uses`, and `use_count <= max_uses`.
- Add owner-only direct invite and link creation/revocation. Store only the invite-link token hash.
- Implement accept/decline and link redemption with row locking. In one transaction validate `status`, `expires_at`, recipient/token, and capacity; create `server_membership(role = MEMBER)`, increment `use_count` for a link, set timestamps/status when exhausted, and emit events.
- Create a `SERVER_INVITATION` `notification` for direct invites with `related_entity_id = server_invite.id`.

#### Step 2.3.2 — FE

- Add owner invite dialog, link settings (`expires_at`, `max_uses`), revoke/copy actions, direct-invite notification actions, and invite-link landing page.
- Show expired, exhausted, revoked, already-member, and declined states explicitly.

#### Step 2.3.3 — Integration

- Connect direct accept/decline and concurrent link redemption.
- Verify `server_invite.status`, `accepted_at`/`declined_at`/`revoked_at`, `use_count`, and the new active `server_membership`.
- Acceptance: concurrent final-use redemption creates at most the allowed memberships, and a token cannot be recovered from stored `token_hash`.

### Feature 2.4 — Membership administration and owner continuity

**User stories:** SRV-06, SRV-07, SRV-09 and the server actions in ADMIN-02.

**Database:** active/history rows in `server_membership`; `role`, `joined_at`, `left_at`, `ended_reason`, `ended_by_user_id`; server deletion fields.

#### Step 2.4.1 — BE

- Add owner member-list, promote-to-owner, kick, and leave commands; add admin invite/kick/delete commands protected by `user_account.system_role = ADMIN`.
- On leave/kick set `left_at`, `ended_reason = LEFT|KICKED`, and `ended_by_user_id` when another user acts.
- If the final owner leaves/is kicked, promote the active `MEMBER` with the latest `joined_at`; serialize this transaction by locking the server/membership set.
- For server deletion set `server.deleted_by_user_id`, `deleted_at`, `deletion_reason`, and end every active membership with `ended_reason = SERVER_DELETED`.

#### Step 2.4.2 — FE

- Build member roster, owner promotion, kick/leave confirmations, and deleted-server state.
- Add scoped admin actions without exposing private chat history.

#### Step 2.4.3 — Integration

- Test multi-owner, last-owner, no-member, rejoin-history, and concurrent leave/promote cases.
- Acceptance: one active membership per user/server remains enforced, historical rows remain, and every nonempty active server has an owner after the transaction.

### Checkpoint — Servers and notifications

- SRV-01 through SRV-07 and SRV-09, NOTI-01 through NOTI-03, and relevant ADMIN-02 flows pass.
- Direct and link invitation races are covered by PostgreSQL integration tests.

## Phase 3 — Realtime server chat

### Feature 3.1 — Message history and idempotent realtime send

**User story:** CHAT-01.

**Database:** `chat_message(id, server_id, sender_user_id, content_text, client_request_id, linked_content_type, linked_content_id, created_at, edited_at, deleted_at, deleted_by_user_id, deletion_reason, purge_at)`, unique `(server_id, sender_user_id, client_request_id)`, and `outbox_event`.

#### Step 3.1.1 — BE/realtime

- Migrate `chat_message`; require `linked_content_type` and `linked_content_id` to be both null or both present.
- Implement cursor-paginated REST history for active members, excluding `deleted_at` rows from normal content.
- Implement authenticated `chat-send` with size/rate limits and caller-generated `client_request_id`; persist message plus `outbox_event` atomically and return the existing row on retry.
- Have the gateway authorize current `server_membership.left_at = null` before joining `server:{serverId}` or forwarding a command.

#### Step 3.1.2 — FE

- Build chat history with reverse/cursor loading, composer, optimistic pending state keyed by `client_request_id`, retry, reconnect indicator, and accessible new-message announcements.
- Reconcile optimistic messages with persisted `chat_message.id` and `created_at`.

#### Step 3.1.3 — Integration

- Connect history plus `chat-created` events; refresh missed history after reconnect.
- Acceptance: two retries with the same `(server_id, sender_user_id, client_request_id)` create one row, non-members cannot read/send, and all members receive the persisted ID.

### Feature 3.2 — Edit, self-delete, and owner removal

**User stories:** CHAT-02, CHAT-03, CHAT-04.

**Database:** `chat_message.content_text`, `edited_at`, `deleted_at`, `deleted_by_user_id`, `deletion_reason`, `purge_at`, and `outbox_event`.

#### Step 3.2.1 — BE/realtime

- Allow only `sender_user_id` to edit a non-deleted message; update `content_text` and `edited_at`.
- Allow sender self-delete; allow an active `OWNER` to remove a `MEMBER` message. Set `deleted_at`, `deleted_by_user_id`, a required owner `deletion_reason`, and `purge_at <= deleted_at + 90 days`.
- Emit sanitized edit/delete events after commit. Ordinary APIs must not return deleted `content_text`.

#### Step 3.2.2 — FE

- Add edit and delete actions to owned messages, owner removal with mandatory reason, an “Edited” label, and deleted-message tombstones.

#### Step 3.2.3 — Integration

- Verify ownership/role failures, realtime reconciliation, and privacy of deleted content.
- Acceptance: sender and owner permissions match the rules, `purge_at` is set, and report evidence remains independent of later deletion.

### Feature 3.3 — Message reactions

**Database:** `react_icon(id, icon_image, name, summary, created_at)` and `message_reaction(message_id, reacted_by_user_id, icon_id, created_at)`.

#### Step 3.3.1 — BE

- Seed/manage allowed `react_icon` rows and implement add/remove/list reactions using primary key `(message_id, reacted_by_user_id, icon_id)`.
- Validate the reactor is an active member and the message is visible.

#### Step 3.3.2 — FE

- Add reaction picker/counts with optimistic updates and accessible labels.

#### Step 3.3.3 — Integration

- Connect reaction events and reconcile aggregate counts after reconnect.
- Acceptance: duplicate reactions are prevented by the composite key and non-members cannot add or remove reactions.

### Checkpoint — Chat

- CHAT-01 through CHAT-04 pass under reconnect, retry, and authorization tests.
- Outbox backlog, duplicate event, and deleted-content privacy tests pass.

## Phase 4 — Video calls and screen sharing

### Feature 4.1 — Start, join, leave, and end one call per server

**User stories:** CALL-01, CALL-02, CALL-03.

**Database:** `call_session(id, server_id, coordinator_user_id, status, livekit_room_name, active_screen_sharer_user_id, started_at, ended_at)` and `call_participation(id, call_session_id, user_id, joined_at, left_at)`.

#### Step 4.1.1 — BE/LiveKit

- Migrate a partial unique index allowing one `call_session.status = ACTIVE` per `server_id`, and one active `call_participation` per `(call_session_id, user_id)` where `left_at IS NULL`.
- Start a call under a server-level lock; set requester as `coordinator_user_id`, generate unique `livekit_room_name`, and set `started_at`.
- Issue short-lived, room-scoped LiveKit tokens only to active members. Under a call lock, limit active participations to 30.
- Process signed LiveKit webhooks idempotently to open/close `call_participation`; when the last participant leaves, set `call_session.status = ENDED` and `ended_at`.

#### Step 4.1.2 — FE

- Build call lobby/in-call UI, device permission handling, mic/camera toggles, participant grid, active call banner, and persistent access to server chat.
- Handle full call, ended call, reconnect, denied devices, and LiveKit failures.

#### Step 4.1.3 — Integration

- Connect start/token/join/webhook/leave/end with LiveKit test infrastructure.
- Acceptance: concurrent starts create one active call, the 31st participant is rejected, non-members receive no token, and no recording is enabled.

### Feature 4.2 — Single screen sharer and coordinator controls

**User stories:** CALL-04, CALL-05, CALL-06.

**Database:** `call_session.active_screen_sharer_user_id` and `call_event(id, call_session_id, actor_user_id, target_user_id, event_type, created_at)` using `FORCE_MUTE`, `SCREEN_SHARE_STARTED`, `SCREEN_SHARE_STOPPED`, `FORCE_SCREEN_SHARE_STOP`.

#### Step 4.2.1 — BE/LiveKit

- Serialize screen-share start/stop on `call_session`; set/clear `active_screen_sharer_user_id` and append the matching `call_event`.
- Permit force mute/stop-share only when `actor_user_id = coordinator_user_id` and that coordinator has an active `call_participation.left_at = null`.
- Call the LiveKit server API only after authorization; record successful control events and clear stale sharer state from signed webhooks.

#### Step 4.2.2 — FE

- Add share/stop controls, single-sharer feedback, coordinator-only participant controls, and disabled coordinator actions while the coordinator is absent.

#### Step 4.2.3 — Integration

- Race two share attempts and test coordinator leave/rejoin.
- Acceptance: only one `active_screen_sharer_user_id` exists, owner status alone grants no call-control power, and the original coordinator regains controls only after rejoining.

### Checkpoint — Calls

- CALL-01 through CALL-06 pass, including 30-participant, single-call, single-sharer, webhook replay, and privacy tests.

## Phase 5 — Document library, classification, and moderation

### Feature 5.1 — Admin-managed categories and collections

**User story:** DOC-05.

**Database:** `category(id, name, created_at, updated_at)`, `collection(id, name, description, slug, created_at, updated_at)`, and `collection_category(collection_id, category_id, created_at)`.

#### Step 5.1.1 — BE

- Migrate taxonomy tables and unique `category.name`, `collection.name`, and `collection.slug` constraints.
- Add admin CRUD and public read APIs; protect deletes that would invalidate existing classification links.
- Resolve the requirements/schema mismatch before migration: requirements say one collection per document while `document_collection` is many-to-many. Recommended decision: keep the join table but add a unique constraint on `document_collection.document_id` for one final collection; if product chooses multiple collections, update requirements first.

#### Step 5.1.2 — FE

- Build admin category/collection list, create/edit forms, slug validation, and category assignment; add public collection browsing primitives.

#### Step 5.1.3 — Integration

- Connect CRUD and assignment with conflict handling.
- Acceptance: only `system_role = ADMIN` mutates taxonomy, public users can read it, and duplicate names/slugs fail predictably.

### Feature 5.2 — Private upload, quarantine, scanning, and submission

**User story:** DOC-03.

**Database:** `media(id, uploaded_by_user_id, file_name, mime_type, size_bytes, object_key, status, scan_completed_at, created_at)`, `document(id, uploaded_by_user_id, media_id, title, description, tags, slug, visibility_status, created_at, updated_at, removed_by_user_id, removed_at, removal_reason)`, and `document_submission(id, document_id, submitted_by_user_id, status, submitted_at, reviewed_by_user_id, reviewed_at, rejection_reason, purge_at)`.

#### Step 5.2.1 — BE/workers

- Migrate the three tables and private S3-compatible object-storage integration.
- Create an upload-init endpoint validating file name, declared `mime_type`, `size_bytes`, title, description, and tags; create `media.status = QUARANTINED`, `document.visibility_status = HIDDEN`, and `document_submission.status = PENDING_PROCESSING`.
- Return a short-lived signed upload URL using opaque `media.object_key`; on completion verify size/signature and queue malware scanning.
- Set `media.status = SCANNING`, then `READY` with `scan_completed_at` or `REJECTED`; rejected files never proceed to OCR or public download.

#### Step 5.2.2 — FE

- Build upload form, direct-to-storage progress, validation, retry, and “my submissions” status view using `media.status` and `document_submission.status`.
- Never expose `object_key` as a permanent public URL.

#### Step 5.2.3 — Integration

- Connect init → signed upload → completion → scan status polling/event.
- Acceptance: invalid/oversized/malicious files remain private, only the uploader/admin sees pending items, and every `document.media_id` references the intended `media` row.

### Feature 5.3 — OCR and agent classification recommendation

**User story:** DOC-11.

**Database:** `agent_classification(id, document_submission_id, model_id, classification_run_id, ocr_text, created_at)`, `agent_classification_collection(agent_classification_id, collection_id, confidence, created_at)`, and `agent_classification_category(agent_classification_id, category_id, confidence, created_at)`.

#### Step 5.3.1 — BE/workers

- Run OCR only for `media.status = READY`; create one idempotent run keyed by unique `classification_run_id`.
- Store OCR output in `agent_classification.ocr_text`, model provenance in `model_id`, and proposed existing collections/categories with `confidence` constrained to `[0,1]`.
- Treat worker output as untrusted. It may move `document_submission.status` from `PENDING_PROCESSING` to `PENDING_REVIEW`, but it must not set `APPROVED`, change `document.visibility_status` to `PUBLIC`, or create taxonomy.

#### Step 5.3.2 — FE

- Build admin review panels for OCR text, proposed collections/categories, confidence, processing failure/retry, and file preview via authorized signed URL.

#### Step 5.3.3 — Integration

- Connect RabbitMQ jobs, retries, idempotent callbacks, and admin queue refresh.
- Acceptance: duplicate worker completion creates one classification run, confidence bounds hold, and no AI result directly publishes a document.

### Feature 5.4 — Human document review, publication, rejection, and removal

**User stories:** DOC-06, DOC-07, DOC-08, DOC-09, DOC-10.

**Database:** review fields on `document_submission`; `document.visibility_status`, `tags`, removal fields; `document_collection`, `document_category`; `notification` kinds `DOCUMENT_REJECTED` and `DOCUMENT_REPORTED`; `audit_log` where sensitive access applies; `outbox_event`.

#### Step 5.4.1 — BE

- Add admin queues by `document_submission.status` and transactional approve/reject decisions.
- Approval requires final `document_collection` assignment, optional `document_category` rows, normalized `document.tags`, `reviewed_by_user_id`, and `reviewed_at`; set submission `APPROVED` and document `PUBLIC`.
- Rejection requires `rejection_reason`, sets `status = REJECTED`, `reviewed_by_user_id`, `reviewed_at`, `purge_at <= reviewed_at + 90 days`, and creates `DOCUMENT_REJECTED` notification.
- Removal sets `document.visibility_status = REMOVED`, `removed_by_user_id`, `removed_at`, and required `removal_reason`; preserved `report_evidence` remains unchanged.

#### Step 5.4.2 — FE

- Build status-filtered moderation queues, compare-agent-suggestion controls, final collection/category/tag editing, approve/reject with required reason, and remove confirmation.
- Update contributor submission views and notification links.

#### Step 5.4.3 — Integration

- Connect decision actions and realtime notifications; verify public visibility changes only after commit.
- Acceptance: an admin—not the agent—sets final status; rejected/removed items are absent from public APIs; uploader receives the specified notification without reporter identity.

### Feature 5.5 — Public search, secure download, and rejected resubmission

**User stories:** DOC-01, DOC-02, DOC-04.

**Database:** public filters over `document.visibility_status = PUBLIC`, latest approved `document_submission.status = APPROVED`, `document.title`, `tags`, `document_collection`, `collection.slug`, and approved `agent_classification.ocr_text`.

#### Step 5.5.1 — BE

- Add PostgreSQL full-text indexes for title and approved OCR text plus indexes for tags and collection joins.
- Implement public search by title, tag, collection, and OCR while excluding `HIDDEN`/`REMOVED` documents and non-approved submissions.
- Issue short-lived download/preview URLs only after current visibility and permission checks.
- For resubmission, retain the same `document.id`, create a new append-only `document_submission.id`, reset visibility to `HIDDEN`, and run scan/OCR/classification again as required by changed content.

#### Step 5.5.2 — FE

- Build public library/search/filter/detail/download pages and contributor resubmission flow showing submission history and rejection reason.

#### Step 5.5.3 — Integration

- Verify search-result and signed-URL invalidation after removal, and resubmission isolation from the rejected attempt.
- Acceptance: only approved/public documents are searchable/downloadable, OCR search uses the approved submission, and resubmission creates a new `document_submission` row.

### Checkpoint — Documents

- DOC-01 through DOC-11 pass from upload to publication/search/resubmission.
- Object storage remains private; AI cannot publish; rejected retention and report preservation tests pass.

## Phase 6 — Public forum, moderation, anonymity, and reactions

### Feature 6.1 — Submit, AI-assist, moderate, edit, and search posts

**User stories:** FORUM-01, FORUM-02, FORUM-03, FORUM-04, FORUM-06, FORUM-09.

**Database:** `forum_post(id, author_user_id, title, content, topics, is_anonymous, status, ai_recommendation, ai_confidence, moderated_by_user_id, moderated_at, moderation_reason, created_at, updated_at, deleted_at)` and `notification.kind = FORUM_POST_APPROVED`.

#### Step 6.1.1 — BE/workers

- Migrate `forum_post`; validate JSON `content`, normalized free-form `topics`, and `ai_confidence` in `[0,1]`.
- Create posts as `PENDING_REVIEW`. AI may set `ai_recommendation`/`ai_confidence` only; admin approve/reject/remove sets `status`, `moderated_by_user_id`, `moderated_at`, and `moderation_reason`.
- On approval create `FORUM_POST_APPROVED` notification and search index entry. Author edit resets `status = PENDING_REVIEW` and removes the post from public search until re-approved.
- Search only `status = APPROVED` and `deleted_at IS NULL` by one or more `topics`.

#### Step 6.1.2 — FE

- Build post editor/topic input, my-post statuses, public feed/detail/search, and admin moderation queue with AI recommendation clearly labeled as advisory.

#### Step 6.1.3 — Integration

- Connect author → AI job → admin decision → public feed/notification → edit/re-review.
- Acceptance: pending/rejected/removed posts are never public, AI cannot decide status, and editing an approved post hides it until reapproval.

### Feature 6.2 — Comments and thread-scoped anonymous aliases

**User stories:** FORUM-05, FORUM-07, FORUM-08.

**Database:** `comment(id, parent_id, forum_post_id, author_user_id, content, is_anonymous, status, created_at, updated_at, deleted_at)`, `anonymous_alias(id, forum_post_id, user_id, display_alias, created_at)` with both unique constraints.

#### Step 6.2.1 — BE

- Allow comments/replies only when the parent `forum_post.status = APPROVED` and `deleted_at IS NULL`; validate `comment.parent_id` belongs to the same `forum_post_id`.
- For anonymous post/comment output, create/reuse one `anonymous_alias` per `(forum_post_id, user_id)` and expose `display_alias` instead of `author_user_id` profile data.
- If a user has any anonymous post/comment participation in a thread, force later comments in that thread to `is_anonymous = true`.
- Add admin identity-reveal endpoint requiring moderation/report purpose; append `audit_log` before returning the real identity.

#### Step 6.2.2 — FE

- Build nested comments, reply/edit controls, anonymous choice, alias rendering, and admin reveal dialog requiring a purpose.
- Ensure public caches never receive hidden author data.

#### Step 6.2.3 — Integration

- Test same-user/same-thread alias stability, different-thread unlinkability, forced continued anonymity, and reveal audit.
- Acceptance: public responses cannot infer `author_user_id`; duplicate aliases are prevented; every reveal has an `audit_log` row.

### Feature 6.3 — Forum reactions, comment removal, and cross-module chat sharing

**User stories:** SRV-08, FORUM-10, and FORUM-11 support.

**Database:** `post_reaction(forum_post_id, user_id, reaction, created_at, updated_at)`, `comment_reaction(comment_id, user_id, reaction, created_at, updated_at)`, `comment.status`, `comment.deleted_at`, and `chat_message.linked_content_type`, `linked_content_id`.

#### Step 6.3.1 — BE

- Implement one `LIKE|DISLIKE` reaction per user/resource using the composite keys; support change/remove atomically.
- Allow author edits where permitted and admin/report-driven comment removal by setting `comment.status = REMOVED` and `deleted_at`.
- For `linked_content_type = DOCUMENT|FORUM_POST`, require active server membership and validate `linked_content_id` against a `document.visibility_status = PUBLIC` document or `forum_post.status = APPROVED` non-deleted post.
- Return only a safe current preview; the source remains in the document/forum module and a removed source becomes unavailable on the next read.

#### Step 6.3.2 — FE

- Add post/comment reaction controls and counts, removed-comment tombstones, and “share to server” actions on both document and forum detail pages, limited to active memberships.

#### Step 6.3.3 — Integration

- Connect reaction updates and both sharing paths to `chat_message(linked_content_type, linked_content_id)` using `DOCUMENT` or `FORUM_POST`.
- Acceptance: one reaction per user/resource, private/pending content cannot be linked, and shared previews stop rendering source data after document/post removal.

### Checkpoint — Forum

- FORUM-01 through FORUM-10 pass; FORUM-11 completes with Phase 7 report resolution.
- Anonymous identity never enters public payloads, logs, analytics, or FE caches.

## Phase 7 — Reports, scoped moderation, audit, and admin enforcement

### Feature 7.1 — Report submission with immutable evidence

**User stories:** RPT-01, RPT-02, RPT-03.

**Database:** `report(id, reported_by_user_id, target_type, target_id, reason, description, status, assigned_admin_id, resolved_by_admin_id, resolution, created_at, resolved_at)` and `report_evidence(id, report_id, source_type, snapshot, captured_at, purge_at)`.

#### Step 7.1.1 — BE

- Migrate report tables and add target-specific snapshot serializers for `USER_ACCOUNT`, `SERVER`, `CHAT_MESSAGE`, `DOCUMENT`, `FORUM_POST`, `COMMENT`, and `CALL_BEHAVIOR`.
- In one transaction insert `report.status = OPEN` and immutable `report_evidence` with `captured_at` and `purge_at <= captured_at + 180 days`.
- For `CALL_BEHAVIOR`, use `report.target_id` for the reported account and store only occurrence time and behavior type in `report_evidence.snapshot`; do not record media.
- Prevent updates/deletes of evidence snapshots at the repository/database privilege layer.

#### Step 7.1.2 — FE

- Add a reusable report dialog to every supported target and a dedicated call-behavior form with reason/description, reported person, time, and behavior.
- Confirm submission without exposing evidence internals or moderation status details.

#### Step 7.1.3 — Integration

- Submit each `ReportTargetType`, then edit/delete the source and confirm `report_evidence.snapshot` does not change.
- Acceptance: unsupported/inaccessible targets fail, duplicate/rate-limit controls work, call reports contain no recording, and evidence has the correct `purge_at`.

### Feature 7.2 — Admin report case management and sensitive-read audit

**User stories:** RPT-04, ADMIN-03, completes FORUM-08 and FORUM-11.

**Database:** report assignment/resolution fields and `audit_log(id, actor_admin_id, action, target_type, target_id, report_id, purpose, occurred_at, metadata, retain_until)`.

#### Step 7.2.1 — BE

- Add paginated admin queues by `report.status`, assignment using `assigned_admin_id`, and resolution using `resolved_by_admin_id`, `resolution`, `resolved_at`, and `RESOLVED|DISMISSED`.
- Return the immutable snapshot by default. Grant narrowly scoped source/nearby context only when needed for that `report.id`.
- Before returning reported private chat or anonymous real identity, append an immutable `audit_log` with admin, action, target, report, required `purpose`, `occurred_at`, minimal metadata, and `retain_until <= occurred_at + 1 year`.
- Add read-only audit-log APIs for admins; prevent mutation of `audit_log` rows.

#### Step 7.2.2 — FE

- Build report queue/detail/assignment/resolution screens, evidence viewer, purpose-gated sensitive reveal, and audit-log explorer.
- Keep evidence and live source clearly separated so admins know which data is immutable.

#### Step 7.2.3 — Integration

- Connect full case lifecycle and verify audit insertion occurs before sensitive data response.
- Acceptance: unrelated private history is inaccessible, report status transitions are valid, and sensitive reads always leave immutable audit records.

### Feature 7.3 — Account/server/content enforcement dashboard

**User stories:** ADMIN-01, ADMIN-02, ADMIN-04.

**Database:** `user_account.account_status`, `email_verified_at`; server deletion/membership end fields; document/forum/comment moderation fields; `audit_log`; `notification` for permitted direct admin communication.

#### Step 7.3.1 — BE

- Add admin account search/detail and ban/unban. Ban sets `account_status = BANNED` and revokes all live `refresh_session`; unban restores `ACTIVE` only when `email_verified_at` is present, otherwise `UNVERIFIED`.
- Reuse Feature 2.4 for admin server invite/kick/delete and Features 5/6 for content action; do not create bypass endpoints with weaker rules.
- Record enforcement actions in `audit_log` with target, purpose, related `report_id` when applicable, and retention.
- Return aggregate admin metrics from bounded queries; never provide unrestricted private chat/call browsing.

#### Step 7.3.2 — FE

- Build admin navigation and account/server/content management views with status filters, confirmation/reason fields, and links back to related reports/audit entries.

#### Step 7.3.3 — Integration

- Ban/unban accounts with and without `email_verified_at`; verify session revocation and FE logout. Exercise server/content actions from a report.
- Acceptance: ADMIN-01 through ADMIN-04 pass, actions reuse domain rules, and no admin screen enables silent call entry or unrestricted private-chat access.

### Checkpoint — Moderation and administration

- RPT-01 through RPT-04, FORUM-11, and ADMIN-01 through ADMIN-04 pass.
- Evidence and audit append-only behavior, 180-day/one-year retention dates, and purpose-scoped reads are tested.

## Phase 8 — Retention, resilience, accessibility, and release

### Feature 8.1 — Retention and purge automation

**Database:** `chat_message.purge_at`, rejected `document_submission.purge_at`, `report_evidence.purge_at`, `audit_log.retain_until`, object-storage keys referenced by `media.object_key`, and notifications retained until `notification.deleted_at` or account deletion.

#### Step 8.1.1 — BE/workers

- Add idempotent scheduled jobs that permanently purge eligible soft-deleted chat content after at most 90 days, rejected submission artifacts after at most 90 days, report evidence after at most 180 days, and audit logs after at most one year.
- Delete private storage objects safely only when no retained document/evidence requires them; mark `media.status = DELETED` after confirmed object deletion.
- Do not auto-expire notifications; exclude `notification.deleted_at` rows from user views.

#### Step 8.1.2 — FE

- Add clear retention/deletion copy in destructive actions and admin status screens; ensure expired content yields a neutral unavailable state.

#### Step 8.1.3 — Integration

- Run jobs against time-controlled fixtures and verify database/object-storage outcomes plus repeat safety.
- Acceptance: jobs respect every `purge_at`/`retain_until`, preserve not-yet-due evidence, and produce auditable metrics without logging purged content.

### Feature 8.2 — Security, accessibility, and failure recovery

#### Step 8.2.1 — BE/realtime

- Apply rate limits to login, password reset, invite redemption, upload, chat, and report creation; validate upload signatures; enforce TLS/security headers and strict CORS.
- Add retry/dead-letter handling for workers, outbox reconciliation, webhook signature/replay protection, structured logging, metrics, and alerts.
- Run dependency, static-analysis, authorization matrix, and secret scans. Rotate the prototype JWT keys and production credentials before release.

#### Step 8.2.2 — FE

- Complete keyboard navigation, focus management, labels, contrast, responsive layouts, reduced-motion support, and screen-reader announcements for realtime changes.
- Add consistent offline/retry/error states and prevent sensitive data from remaining after logout/account ban.

#### Step 8.2.3 — Integration

- Run automated accessibility checks, security regression tests, connection-loss/queue-retry scenarios, and role-based E2E suites.
- Acceptance: no critical/high security finding remains, core flows meet WCAG 2.2 AA checks, and transient failures recover without duplicate committed state.

### Feature 8.3 — Scale validation, deployment, and operational handoff

#### Step 8.3.1 — BE/infrastructure

- Package Spring Boot, the Socket.IO gateway, workers, PostgreSQL, RabbitMQ, Redis, object storage, and LiveKit configuration for staging/production.
- Add production indexes based on measured queries, connection-pool limits, database backup/restore, object lifecycle safeguards, and migration rollback/forward-fix procedures.
- Load-test the documented target only: about 1,000 accounts, 500 concurrent users, 200 concurrent call participants system-wide, and 30 participants per call.

#### Step 8.3.2 — FE

- Produce environment-specific builds, cache immutable assets, validate bundle size, configure runtime API/realtime/LiveKit endpoints, and publish user/admin operational help.

#### Step 8.3.3 — Integration

- Run the full staging suite: personal auth, UIT SSO, server invitation, chat/reconnect, call, document pipeline, forum moderation/anonymity, reporting, notification, admin action, and retention.
- Perform backup/restore and rollback drills; record dashboards, alerts, runbooks, and ownership.
- Acceptance: all project-wide definition-of-done gates pass at target scale and the release checklist is signed off.

### Final checkpoint

- All user stories AUTH-01–08, SRV-01–09, CHAT-01–04, CALL-01–06, DOC-01–11, FORUM-01–11, RPT-01–04, NOTI-01–03, and ADMIN-01–04 are traceable to passing integrated tests.
- BE: `cd app/backend && ./gradlew check` passes.
- FE: `cd app/frontend && npm ci && npm run lint && npm run build && npm test -- --run && npm run test:e2e` passes.
- Realtime gateway/worker checks and full-stack staging smoke/load tests pass.
- No out-of-scope feature has been introduced.

## 4. Database coverage checklist

| Tables                                                                                                | Primary implementation feature                         |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `user_account`, `account_token`, `refresh_session`                                              | 1.1–1.4                                               |
| `outbox_event`                                                                                      | 0.2, then reused by all realtime/notification features |
| `notification`                                                                                      | 2.1, then reused by invites/documents/forum            |
| `server`, `server_membership`, `server_invite`                                                  | 2.2–2.4                                               |
| `chat_message`, `react_icon`, `message_reaction`                                                | 3.1–3.3                                               |
| `call_session`, `call_participation`, `call_event`                                              | 4.1–4.2                                               |
| `media`, `document`, `document_submission`                                                      | 5.2, 5.4–5.5                                          |
| `agent_classification`, `agent_classification_collection`, `agent_classification_category`      | 5.3                                                    |
| `category`, `collection`, `document_category`, `document_collection`, `collection_category` | 5.1, 5.4                                               |
| `forum_post`, `comment`, `anonymous_alias`, `post_reaction`, `comment_reaction`             | 6.1–6.3                                               |
| `report`, `report_evidence`, `audit_log`                                                        | 7.1–7.3                                               |

## 5. Traceability summary

| Product area   | Stories      | Plan features                                |
| -------------- | ------------ | -------------------------------------------- |
| Identity       | AUTH-01–08  | 1.1–1.4                                     |
| Servers        | SRV-01–09   | 2.2–2.4, 6.3                                |
| Chat           | CHAT-01–04  | 3.1–3.2                                     |
| Calls          | CALL-01–06  | 4.1–4.2                                     |
| Documents      | DOC-01–11   | 5.1–5.5                                     |
| Forum          | FORUM-01–11 | 6.1–6.3, 7.2                                |
| Reports        | RPT-01–04   | 7.1–7.2                                     |
| Notifications  | NOTI-01–03  | 2.1 plus feature-specific producers          |
| Administration | ADMIN-01–04 | 7.2–7.3 plus feature-specific admin screens |

## 6. Risks and required decision gates

| Risk/decision                                                                                     | Impact                                       | Required action before implementation                                                                                               |
| ------------------------------------------------------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| UIT SSO contract and sandbox are unavailable                                                      | Blocks AUTH-01                               | Obtain issuer, endpoints, client registration, claim mapping, and test tenant during Phase 1; keep a protocol-faithful stub for CI. |
| One collection requirement conflicts with the many-to-many`document_collection` schema          | Can produce invalid product behavior         | Decide in Feature 5.1; recommended: unique`document_collection.document_id` while keeping the join table.                         |
| Socket.IO gateway is not present in the repository                                                | Blocks chat/notification/call state delivery | Add`app/realtime-gateway` in Phase 0 and keep Spring Boot as business-rule authority.                                             |
| Object storage, malware scanner, OCR/AI, email, and LiveKit providers are not selected/configured | Blocks external integrations                 | Define provider interfaces and local fakes first; select production providers before their feature phase.                           |
| Current JWT and user lookup code is prototype-only                                                | Security and correctness risk                | Replace and rotate configuration in Phase 0/1 before exposing protected APIs.                                                       |
| Two FE lockfiles imply competing package managers                                                 | Non-reproducible builds                      | Standardize on npm in Phase 0 unless the team explicitly records a different choice.                                                |
| AI/OCR output may be malformed or adversarial                                                     | Incorrect publication/moderation             | Validate all worker output; permit recommendations only; require explicit admin decisions.                                          |
| Concurrent invite, owner, call, and screen-share changes                                          | Duplicate/invalid state                      | Use PostgreSQL constraints plus row locks and concurrency integration tests at each feature step.                                   |

## 7. Explicit out-of-scope boundaries

Do not add direct messages, public server discovery, multiple chat/call channels per server, simultaneous calls per server, simultaneous screen sharers, default call recording, hidden admin call access, unrestricted private-chat browsing, mandatory admin-managed forum topics, or scaling beyond the documented targets. Any scope change requires updating requirements and `docs/DATABASE.txt` before implementation.
