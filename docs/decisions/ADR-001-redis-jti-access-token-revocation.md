# ADR-001: Current Session Revocation

## Status

Accepted

## Date

2026-10-10

## Context

Signed JWT access tokens otherwise remain usable until `exp`, including after logout. Refresh tokens also remain usable until their database session is revoked. The application already issues a unique `jti`, hashes refresh tokens in PostgreSQL, and has an Upstash Redis integration.

## Decision

On logout, store the verified access token's `jti` under `auth:revoked-access-token:<jti>` with a TTL equal to the token's remaining lifetime. Every bearer-token authentication checks this key before accepting the token. Redis lookup failures fail closed.

The same request supplies the current refresh token. Its signature, subject, expiry, database hash, ownership, and active state are verified before setting `revoked_at`. Raw tokens are never persisted.

A custom Spring MVC logout endpoint invokes Spring Security's context logout handler and returns `204 No Content`.

## Alternatives Considered

### Store raw access tokens

Rejected because a Redis disclosure would expose usable credentials.

### Store a hash of each access token

Valid but redundant because signed tokens already carry a unique `jti` designed to identify the token.

### Rotate the signing key on logout

Rejected because it would invalidate every user's token, not only the current session.

## Consequences

- Logout invalidates the current access token immediately.
- Logout invalidates the matching refresh session without affecting other devices.
- Protected requests add one Redis lookup.
- Revocation state cleans itself up at token expiration.
- Redis becomes part of the authentication availability path.
- Logout requires the client to submit its refresh token in the request body.
