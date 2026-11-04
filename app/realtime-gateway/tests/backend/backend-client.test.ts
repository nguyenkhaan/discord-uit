import { afterEach, expect, test } from "bun:test";
import { BackendClient, BackendError } from "../../src/backend/backend-client";

const GATEWAY_TOKEN = "g".repeat(32);
const ACCESS_TOKEN = "signed-access-token";
const USER_ID = "00000000-0000-0000-0000-000000000001";
const SESSION_ID = "7c9e6679-7425-40de-944b-e07fc1f90ae7";

let server: ReturnType<typeof Bun.serve> | undefined;

afterEach(() => {
    server?.stop(true);
    server = undefined;
});

test("validates a session using both gateway and bearer credentials", async () => {
    const received: {
        authorization: string | null;
        gatewayToken: string | null;
    } = {
        authorization: null,
        gatewayToken: null,
    };

    server = Bun.serve({
        port: 0,
        fetch(request) {
            received.authorization = request.headers.get("authorization");
            received.gatewayToken = request.headers.get("x-gateway-token");

            return Response.json({
                userId: USER_ID,
                sessionId: SESSION_ID,
                accountStatus: "ACTIVE",
            });
        },
    });

    const client = new BackendClient(server.url.toString(), GATEWAY_TOKEN);

    await expect(client.validateSession(ACCESS_TOKEN)).resolves.toEqual({
        userId: USER_ID,
        sessionId: SESSION_ID,
        accountStatus: "ACTIVE",
    });
    expect(received.authorization).toBe(`Bearer ${ACCESS_TOKEN}`);
    expect(received.gatewayToken).toBe(GATEWAY_TOKEN);
});

test("reports Spring rejection without exposing its response body", async () => {
    server = Bun.serve({
        port: 0,
        fetch: () => new Response("internal details", { status: 401 }),
    });

    const client = new BackendClient(server.url.toString(), GATEWAY_TOKEN);

    try {
        await client.validateSession(ACCESS_TOKEN);
        throw new Error("Expected validateSession to reject");
    } catch (error) {
        expect(error).toBeInstanceOf(BackendError);
        expect((error as BackendError).reason).toBe("http-error");
        expect((error as BackendError).status).toBe(401);
        expect((error as Error).message).not.toContain("internal details");
    }
});

test("rejects a malformed successful response", async () => {
    server = Bun.serve({
        port: 0,
        fetch: () => Response.json({ userId: "not-a-uuid" }),
    });

    const client = new BackendClient(server.url.toString(), GATEWAY_TOKEN);

    await expect(client.validateSession(ACCESS_TOKEN)).rejects.toMatchObject({
        reason: "invalid-response",
        status: 200,
    });
});
