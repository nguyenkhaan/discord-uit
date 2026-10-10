# Spec: Current Session Logout

## Objective

`POST /api/auth/logout` must revoke the presented access token and its paired refresh session without affecting the user's other sessions.

## Tech Stack

- Java 17
- Spring Boot 4.1.1 and Spring Security 7.1.1
- JJWT 0.12.6
- Existing Upstash Redis REST integration

## Commands

- Focused tests: `./gradlew test --tests '*JwtUtilTests' --tests '*AccessTokenRevocationServiceTests' --tests '*JwtRequestFilterTests' --tests '*AuthControllerTests'`
- Full tests: `./gradlew test`
- Build: `./gradlew build`
- Development: `./gradlew bootRun`

## Project Structure

- `app/backend/src/main/java/com/cloudian/backend/utils` — JWT creation and claim parsing
- `app/backend/src/main/java/com/cloudian/backend/services` — Redis-backed access-token revocation
- `app/backend/src/main/java/com/cloudian/backend/filters` — bearer-token authentication and blacklist enforcement
- `app/backend/src/main/java/com/cloudian/backend/modules/auth` — logout API
- `app/backend/src/test/java` — focused unit and web-layer tests

## Code Style

Use constructor injection and intent-revealing methods:

```java
if (accessTokenRevocationService.isRevoked(accessToken)) {
    return false;
}
```

## Testing Strategy

- Unit-test `jti` generation/extraction and Redis TTL calculation.
- Unit-test ownership, expiry, and revocation checks for the presented refresh token.
- Unit-test that the JWT filter rejects a revoked access token.
- Controller test that logout revokes the bearer token, clears the security context, and returns `204`.
- Run the existing backend suite and report unrelated baseline failures separately.

## Boundaries

- Always: validate the signed access token before trusting `jti`; fail closed when revocation lookup fails; expire blacklist entries with the token.
- Ask first: database schema changes, refresh-token rotation, logout-all-devices.
- Never: store raw access tokens, expose tokens in logs, or accept client-provided `jti` outside a verified JWT.

## Success Criteria

- Every generated token has a unique `jti` that can be extracted after signature verification.
- Logout stores only the access token's `jti` in Redis until `exp`, marks the matching refresh session revoked, and returns `204`.
- A revoked access token receives `401` on subsequent protected requests.
- The revoked refresh session cannot be used by a future refresh flow.
- Unrevoked valid access tokens continue to authenticate.

## Open Questions

None. The request body carries the current refresh token; only its SHA-256 hash is used for lookup.
