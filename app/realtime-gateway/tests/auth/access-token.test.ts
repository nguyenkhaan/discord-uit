import { expect, test } from "bun:test";
import { extractAccessToken } from "../../src/auth/access-token";

function handshake(input: {
    cookie?: string;
    authToken?: unknown;
    queryToken?: string;
}) {
    return {
        headers: input.cookie ? { cookie: input.cookie } : {},
        auth:
            input.authToken === undefined
                ? {}
                : { accessToken: input.authToken },
        query: input.queryToken ? { accessToken: input.queryToken } : {},
    };
}

test("prefers the HttpOnly access-token cookie", () => {
    const token = extractAccessToken(
        handshake({
            cookie: "theme=dark; access_token=cookie-token",
            authToken: "auth-token",
        }),
    );

    expect(token).toBe("cookie-token");
});

test("falls back to handshake auth when the cookie is absent", () => {
    const token = extractAccessToken(handshake({ authToken: "auth-token" }));

    expect(token).toBe("auth-token");
});

test("does not accept an access token from the query string", () => {
    const token = extractAccessToken(handshake({ queryToken: "query-token" }));

    expect(token).toBeNull();
});

test("rejects non-string and blank auth tokens", () => {
    expect(extractAccessToken(handshake({ authToken: 123 }))).toBeNull();
    expect(extractAccessToken(handshake({ authToken: "   " }))).toBeNull();
});
