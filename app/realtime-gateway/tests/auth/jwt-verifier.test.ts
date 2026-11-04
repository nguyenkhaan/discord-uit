import { afterEach, beforeEach, expect, test } from "bun:test";
import {
    exportJWK,
    generateKeyPair,
    SignJWT,
    type CryptoKey,
    type JWK,
} from "jose";
import { createJwtVerifier } from "../../src/auth/jwt-verify";

const ISSUER = "uit-connect";
const AUDIENCE = "uit-connect-realtime";
const KEY_ID = "access-key-1";
const USER_ID = "00000000-0000-0000-0000-000000000001";
const SESSION_ID = "7c9e6679-7425-40de-944b-e07fc1f90ae7";
const TOKEN_ID = "6ba7b810-9dad-41d1-80b4-00c04fd430c8";

let privateKey: CryptoKey;
let publicJwk: JWK;
let jwksServer: ReturnType<typeof Bun.serve>;

beforeEach(async () => {
    const keyPair = await generateKeyPair("RS256");
    privateKey = keyPair.privateKey;
    publicJwk = {
        ...(await exportJWK(keyPair.publicKey)),
        alg: "RS256",
        kid: KEY_ID,
        use: "sig",
    };

    jwksServer = Bun.serve({
        port: 0,
        fetch: () => Response.json({ keys: [publicJwk] }),
    });
});

afterEach(() => {
    jwksServer.stop(true);
});

async function token(
    options: {
        audience?: string;
        includeKid?: boolean;
        includeSessionId?: boolean;
    } = {},
): Promise<string> {
    const claims: Record<string, string> = {
        jti: TOKEN_ID,
    };

    if (options.includeSessionId !== false) {
        claims.sid = SESSION_ID;
    }

    return new SignJWT(claims)
        .setProtectedHeader({
            alg: "RS256",
            ...(options.includeKid === false ? {} : { kid: KEY_ID }),
        })
        .setSubject(USER_ID)
        .setIssuer(ISSUER)
        .setAudience(options.audience ?? AUDIENCE)
        .setIssuedAt()
        .setExpirationTime("5m")
        .sign(privateKey);
}

function verifier() {
    return createJwtVerifier({
        jwtIssuer: ISSUER,
        jwtAudience: AUDIENCE,
        jwtJwksUrl: new URL("/jwks.json", jwksServer.url).toString(),
    });
}

test("verifies an RS256 access token and returns trusted identity claims", async () => {
    const verifyAccessToken = verifier();

    await expect(verifyAccessToken(await token())).resolves.toEqual({
        userId: USER_ID,
        sessionId: SESSION_ID,
        tokenId: TOKEN_ID,
    });
});

test("rejects a token for a different audience", async () => {
    const verifyAccessToken = verifier();

    await expect(
        verifyAccessToken(await token({ audience: "other-service" })),
    ).rejects.toThrow();
});

test("rejects a token without kid", async () => {
    const verifyAccessToken = verifier();

    await expect(
        verifyAccessToken(await token({ includeKid: false })),
    ).rejects.toThrow();
});

test("rejects a token without sid", async () => {
    const verifyAccessToken = verifier();

    await expect(
        verifyAccessToken(await token({ includeSessionId: false })),
    ).rejects.toThrow();
});
