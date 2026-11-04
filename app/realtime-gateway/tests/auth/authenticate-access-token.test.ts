import { expect, test } from "bun:test";
import {
    AuthenticationError,
    createAccessTokenAuthenticator,
} from "../../src/auth/authentication-access-token";

const ACCESS_TOKEN = "signed-access-token";
const USER_ID = "0f8fad5b-d9cb-469f-a165-70867728950e";
const SESSION_ID = "7c9e6679-7425-40de-944b-e07fc1f90ae7";
const TOKEN_ID = "6ba7b810-9dad-41d1-80b4-00c04fd430c8";

function verifier() {
    return async () => ({
        userId: USER_ID,
        sessionId: SESSION_ID,
        tokenId: TOKEN_ID,
    });
}

function sessionValidator(
    overrides: Partial<{
        userId: string;
        sessionId: string;
    }> = {},
) {
    return async () => ({
        userId: overrides.userId ?? USER_ID,
        sessionId: overrides.sessionId ?? SESSION_ID,
        accountStatus: "ACTIVE" as const,
    });
}

test("returns one authenticated context when JWT and Spring agree", async () => {
    const authenticate = createAccessTokenAuthenticator(
        verifier(),
        sessionValidator(),
    );

    await expect(authenticate(ACCESS_TOKEN)).resolves.toEqual({
        accessToken: ACCESS_TOKEN,
        userId: USER_ID,
        sessionId: SESSION_ID,
    });
});

test("rejects when Spring resolves a different user", async () => {
    const authenticate = createAccessTokenAuthenticator(
        verifier(),
        sessionValidator({
            userId: "16fd2706-8baf-433b-82eb-8c7fada847da",
        }),
    );

    await expect(authenticate(ACCESS_TOKEN)).rejects.toBeInstanceOf(
        AuthenticationError,
    );
});

test("rejects when Spring resolves a different session", async () => {
    const authenticate = createAccessTokenAuthenticator(
        verifier(),
        sessionValidator({
            sessionId: "886313e1-3b8a-4a3d-9e25-1db67ac239ef",
        }),
    );

    await expect(authenticate(ACCESS_TOKEN)).rejects.toBeInstanceOf(
        AuthenticationError,
    );
});

test("sanitizes verifier and backend errors", async () => {
    const authenticate = createAccessTokenAuthenticator(async () => {
        throw new Error("sensitive JWT details");
    }, sessionValidator());

    try {
        await authenticate(ACCESS_TOKEN);
        throw new Error("Expected authentication to reject");
    } catch (error) {
        expect(error).toBeInstanceOf(AuthenticationError);
        expect((error as Error).message).toBe("Authentication failed");
        expect((error as Error).message).not.toContain("JWT details");
    }
});
