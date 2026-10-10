# Implementation Plan: Current Session Logout

## Overview

Add Redis-backed access-token revocation keyed by verified JWT ID, revoke the matching database refresh session, expose stateless logout, and enforce access revocation in the existing JWT filter.

## Architecture Decisions

- Store only `auth:revoked-access-token:<jti>` with a TTL matching the token's remaining lifetime.
- Find the current refresh session by the existing SHA-256 token hash and verify it belongs to the authenticated user before revoking it.
- Use a custom logout endpoint because logout requires a refresh-token request body; invoke Spring Security's context logout handler explicitly.

## Task List

### Phase 1: Token identity

- [x] Add failing tests for unique/extractable `jti` claims.
- [x] Add the minimal claim extraction API.

### Phase 2: Revocation enforcement

- [x] Add failing tests for Redis revocation TTL and lookup.
- [x] Implement the revocation service and Redis key.
- [x] Add failing filter test, then reject revoked bearer tokens.

### Phase 3: Logout API

- [x] Add a failing logout test.
- [x] Revoke the bearer token and matching refresh session, clear the security context, and return `204`.

### Checkpoint: Complete

- [x] Focused tests pass.
- [x] Full backend tests/build results are recorded.
- [x] No raw token or secret is persisted or logged.

Focused logout/auth tests and `build -x test` pass. The full suite still has the six pre-existing
failures in startup status, shared error schema, and security integration tests.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Redis unavailable | Revocation cannot be checked | Fail closed instead of accepting a possibly revoked token |
| Blacklist grows indefinitely | Redis storage leak | TTL equals remaining token lifetime |
| Refresh token belongs to another user | Cross-session revocation | Verify signed subject and session owner against the authenticated user |
| Redis and PostgreSQL cannot share a transaction | Partial logout on infrastructure failure | Validate first, flush refresh revocation before blacklisting access; return an error on failure |

## Open Questions

None within the approved current-session logout scope.
