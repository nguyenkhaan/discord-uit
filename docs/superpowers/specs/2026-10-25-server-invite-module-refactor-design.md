# Server Invite Module Refactor Design

## Intent

Refactor the existing server invitation implementation into two cohesive child modules so that direct invitations and invite links can evolve independently without changing the existing HTTP contract.

## Goals

- Organize direct-invite code under `serverinvite/directinvite`.
- Organize invite-link code under `serverinvite/invitelink`.
- Keep server membership messaging under `serverinvite/messaging`.
- Preserve all nine endpoint paths, request DTOs, response DTOs, and status codes.
- Preserve raw-token confidentiality by storing only the SHA-256 invite-token hash.
- Correct lifecycle behavior for expiry, revocation, final link use, row locking, membership creation, and durable membership events.
- Keep server-invitation notification creation and notification outbox recording atomic.

## Non-goals

- No frontend changes.
- No new dependency or generic messaging framework.
- No public API redesign.
- No database schema change unless a verified correctness requirement cannot be met in application code.

## Chosen structure

```text
modules/serverinvite/
├── directinvite/
│   ├── DirectInviteController.java
│   ├── DirectInviteService.java
│   └── dto/
├── invitelink/
│   ├── InviteLinkController.java
│   ├── InviteLinkService.java
│   └── dto/
└── messaging/
    ├── ServerMembershipCreatedEvent.java
    └── ServerInviteEventWriter.java
```

The existing `notification` module remains independent. Its notification persistence and outbox creation logic will be consolidated internally without introducing another module.

## Behavior decisions

- A link reaching `maxUses` becomes `ACCEPTED` and records `acceptedAt` on its final successful redemption, using the existing schema.
- Expired invitations are rejected with `410 Gone`; no state is written immediately before throwing a rollback-causing exception.
- Revocation locks the invite row, verifies it is a link, sets `REVOKED`, and records `revokedAt`.
- Accepting a direct invite and redeeming a link lock both the invite and server rows before checking and creating active membership.
- Successful membership creation records a `SERVER_MEMBERSHIP_CREATED` outbox event in the same transaction.
- `GET /invites/{token}` keeps the current authentication behavior; changing public access is outside this refactor.

## Security boundaries

- Path variables, request bodies, and raw invite tokens are untrusted HTTP input.
- OWNER authorization remains enforced in the application service for owner-only operations.
- Direct invite acceptance and decline remain restricted to the recorded recipient.
- Raw invite tokens are hashed before repository lookup and are never persisted or logged.

## Verification

- Focused unit tests cover owner checks, token hashing, lifecycle transitions, recipient checks, timestamps, notification linkage, and outbox events.
- Focused tests are run red before implementation and green afterward.
- The backend compiles and the full test suite is run; pre-existing unrelated failures are reported separately.

## Approved approach

The module structure and inline implementation approach were approved in the conversation before implementation began.
