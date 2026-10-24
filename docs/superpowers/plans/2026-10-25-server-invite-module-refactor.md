# Server Invite Module Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor server invitations into direct-invite and invite-link child modules while correcting transaction and lifecycle behavior without changing the HTTP contract.

**Architecture:** Two focused modules own their controllers, services, and DTOs. Shared membership-event serialization remains in `serverinvite/messaging`; the existing notification module remains independent and reuses its own save-plus-outbox path.

**Tech Stack:** Java 17, Spring Boot 4.1.1, Spring Data JPA, PostgreSQL, JUnit 5, Mockito, AssertJ.

**Spec:** `docs/superpowers/specs/2026-10-25-server-invite-module-refactor-design.md`

## Global Constraints

- Keep all nine endpoint paths and response status codes unchanged.
- Store only the invite token hash.
- Add no dependency and make no database schema change.
- Preserve unrelated user changes in the working tree.
- Use at most three parameters per new method.

## Review Focus

- A non-owner must not create, list, or revoke link invitations or create direct invitations.
- An expired, revoked, consumed, wrong-type, or wrong-recipient invitation must not create membership.
- The last link redemption must not exceed `maxUses` and must finalize status and timestamp.
- A successful admission must persist membership and its outbox event atomically.
- Direct invitation notification must reference the saved `server_invite.id`.

---

### Task 1: Direct invitation module

**Files:**
- Create: `app/backend/src/main/java/com/cloudian/backend/modules/serverinvite/directinvite/DirectInviteController.java`
- Create: `app/backend/src/main/java/com/cloudian/backend/modules/serverinvite/directinvite/DirectInviteService.java`
- Create/move: `app/backend/src/main/java/com/cloudian/backend/modules/serverinvite/directinvite/dto/*.java`
- Test: `app/backend/src/test/java/com/cloudian/backend/modules/serverinvite/directinvite/DirectInviteServiceTests.java`

**Interfaces:**
- Produces: create, list pending, accept, and decline direct-invite operations with the existing DTO shapes.
- Consumes: repositories, `NotificationService`, and `ServerInviteEventWriter`.

- [x] Write focused failing tests for owner authorization, notification linkage, expiry, recipient validation, accept/decline transitions, membership creation, and event creation.
- [x] Run the focused test and verify RED.
- [x] Implement the direct-invite module and move its DTOs.
- [x] Run the focused test and verify GREEN.

### Task 2: Invite-link module

**Files:**
- Create: `app/backend/src/main/java/com/cloudian/backend/modules/serverinvite/invitelink/InviteLinkController.java`
- Create: `app/backend/src/main/java/com/cloudian/backend/modules/serverinvite/invitelink/InviteLinkService.java`
- Create/move: `app/backend/src/main/java/com/cloudian/backend/modules/serverinvite/invitelink/dto/*.java`
- Modify: `app/backend/src/main/java/com/cloudian/backend/repositories/ServerInviteRepository.java`
- Modify: `app/backend/src/main/java/com/cloudian/backend/repositories/ServerRepository.java`
- Test: `app/backend/src/test/java/com/cloudian/backend/modules/serverinvite/invitelink/InviteLinkServiceTests.java`

**Interfaces:**
- Produces: create, list, revoke, inspect, and redeem invite-link operations with the existing DTO shapes.
- Consumes: repositories and `ServerInviteEventWriter`.

- [x] Write focused failing tests for token hashing, owner authorization, locked revocation, expiry, capacity, final-use status, membership creation, and event creation.
- [x] Run the focused test and verify RED.
- [x] Implement the invite-link module and move its DTOs.
- [x] Run the focused test and verify GREEN.

### Task 3: Shared messaging and notification cleanup

**Files:**
- Create: `app/backend/src/main/java/com/cloudian/backend/modules/serverinvite/messaging/ServerMembershipCreatedEvent.java`
- Create: `app/backend/src/main/java/com/cloudian/backend/modules/serverinvite/messaging/ServerInviteEventWriter.java`
- Modify: `app/backend/src/main/java/com/cloudian/backend/modules/notification/NotificationService.java`
- Modify: `app/backend/src/test/java/com/cloudian/backend/modules/notification/NotificationServiceTests.java`

**Interfaces:**
- Produces: `writeMembershipCreated(ServerMembership)` and one internal notification save-plus-outbox path.

- [x] Write failing tests for membership outbox payload and server-invitation notification linkage.
- [x] Run focused tests and verify RED.
- [x] Implement the messaging writer and consolidate notification persistence.
- [x] Run focused tests and verify GREEN.

### Task 4: Remove replaced module files and verify

**Files:**
- Delete: legacy controllers, `ServerInviteService.java`, and legacy DTO files after all references move.
- Modify: imports and tests that still reference legacy packages.

- [x] Compile and find all remaining legacy references.
- [x] Remove only replaced files after references reach zero.
- [x] Run focused server-invite and notification tests.
- [ ] Run the complete backend test suite. It currently retains six pre-existing failures outside server invites; all focused tests pass.
- [x] Run `./gradlew build -x test --no-daemon`.
- [x] Review the final diff for secrets, unrelated changes, security, readability, and dead code.
