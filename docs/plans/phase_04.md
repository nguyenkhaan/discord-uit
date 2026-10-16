## Phase 4 — Video calls and screen sharing

### Feature 4.1 — Start, join, leave, and end one call per server

**User stories:** CALL-01, CALL-02, CALL-03.

**Database:** `call_session(id, server_id, coordinator_user_id, status, livekit_room_name, active_screen_sharer_user_id, started_at, ended_at)` và `call_participation(id, call_session_id, user_id, joined_at, left_at)`.

#### Step 4.1.1 — BE/LiveKit

- Start call dưới server-level lock; set requester làm `coordinator_user_id`, generate `livekit_room_name` unique và set `started_at`.
- Chỉ cấp LiveKit token short-lived, có room scope cho active member. Dưới call lock, giới hạn active participation ở mức 30.
- Xử lý signed LiveKit webhook theo cách idempotent để open/close `call_participation`; khi participant cuối cùng leave, set `call_session.status = ENDED` và `ended_at`.

#### Step 4.1.2 — FE

- Xây dựng call lobby/in-call UI, xử lý device permission, mic/camera toggle, participant grid, active call banner và quyền truy cập liên tục tới server chat.
- Xử lý full call, ended call, reconnect, device bị từ chối và LiveKit failure.

#### Step 4.1.3 — Integration

- Kết nối start/token/join/webhook/leave/end với LiveKit test infrastructure.
- Acceptance: các lần start đồng thời chỉ tạo một active call, participant thứ 31 bị từ chối, non-member không nhận token và không bật recording.

### Feature 4.2 — Single screen sharer and coordinator controls

**User stories:** CALL-04, CALL-05, CALL-06.

**Database:** `call_session.active_screen_sharer_user_id` và `call_event(id, call_session_id, actor_user_id, target_user_id, event_type, created_at)` sử dụng `FORCE_MUTE`, `SCREEN_SHARE_STARTED`, `SCREEN_SHARE_STOPPED`, `FORCE_SCREEN_SHARE_STOP`.

#### Step 4.2.1 — BE/LiveKit

- Serialize thao tác start/stop screen-share trên `call_session`; set/clear `active_screen_sharer_user_id` và append `call_event` tương ứng.
- Chỉ cho phép force mute/stop-share khi `actor_user_id = coordinator_user_id` và coordinator đó có `call_participation.left_at = null` đang active.
- Chỉ gọi LiveKit server API sau authorization; ghi lại control event thành công và clear sharer state cũ từ signed webhook.

#### Step 4.2.2 — FE

- Thêm control share/stop, feedback cho single-sharer, participant control chỉ dành cho coordinator và disable coordinator action khi coordinator vắng mặt.

#### Step 4.2.3 — Integration

- Cho hai share attempt chạy race và test coordinator leave/rejoin.
- Acceptance: chỉ tồn tại một `active_screen_sharer_user_id`, chỉ có owner status không đủ để có call-control permission, và coordinator ban đầu chỉ lấy lại control sau khi rejoin.

### Checkpoint — Calls

- CALL-01 đến CALL-06 chạy thành công, gồm các test 30-participant, single-call, single-sharer, webhook replay và privacy.
