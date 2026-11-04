import { afterEach, expect, test } from "bun:test";
import { BackendClient, BackendError } from "../../src/backend/backend-client";

const GATEWAY_TOKEN = "g".repeat(32);
const ACCESS_TOKEN = "signed-access-token";
const USER_ID = "6b1f6a8e-3c2d-4e5f-9a7b-1c2d3e4f5a61";
const SESSION_ID = "7c9e6679-7425-40de-944b-e07fc1f90ae7";
const SERVER_ID = "9d4c2b7a-5e6f-4a8b-8c9d-0e1f2a3b4c52";
const CLIENT_REQUEST_ID = "7f9c1ad4-6a85-4b62-b55a-dfaee22fd301";
const MESSAGE_ID = "491f5207-70b2-4c02-8d09-6d8d4e1c76d7";

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

test("authorizes a server using both gateway and bearer credentials", async () => {
    const received = {
        path: "",
        authorization: null as string | null,
        gatewayToken: null as string | null,
    };

    server = Bun.serve({
        port: 0,
        fetch(request) {
            received.path = new URL(request.url).pathname;
            received.authorization = request.headers.get("authorization");
            received.gatewayToken = request.headers.get("x-gateway-token");

            return Response.json({
                serverId: SERVER_ID,
                role: "MEMBER",
            });
        },
    });

    const client = new BackendClient(server.url.toString(), GATEWAY_TOKEN);

    await expect(
        client.authorizeServer(ACCESS_TOKEN, SERVER_ID),
    ).resolves.toEqual({
        serverId: SERVER_ID,
        role: "MEMBER",
    });
    expect(received.path).toBe(
        `/internal/realtime/servers/${SERVER_ID}/authorize`,
    );
    expect(received.authorization).toBe(`Bearer ${ACCESS_TOKEN}`);
    expect(received.gatewayToken).toBe(GATEWAY_TOKEN);
});

test("preserves a not-member response as a typed 404 error", async () => {
    server = Bun.serve({
        port: 0,
        fetch: () => new Response(null, { status: 404 }),
    });

    const client = new BackendClient(server.url.toString(), GATEWAY_TOKEN);

    await expect(
        client.authorizeServer(ACCESS_TOKEN, SERVER_ID),
    ).rejects.toMatchObject({
        reason: "http-error",
        status: 404,
    });
});

test("creates a chat message with trusted gateway credentials", async () => {
    const received = {
        path: "",
        authorization: null as string | null,
        gatewayToken: null as string | null,
        body: undefined as unknown,
    };

    server = Bun.serve({
        port: 0,
        async fetch(request) {
            received.path = new URL(request.url).pathname;
            received.authorization = request.headers.get("authorization");
            received.gatewayToken = request.headers.get("x-gateway-token");
            received.body = await request.json();

            return Response.json({
                messageId: MESSAGE_ID,
                serverId: SERVER_ID,
                senderUserId: USER_ID,
                clientRequestId: CLIENT_REQUEST_ID,
                contentText: "Hello realtime",
                createdAt: "2026-11-05T03:00:00Z",
            });
        },
    });

    const client = new BackendClient(server.url.toString(), GATEWAY_TOKEN);

    await expect(
        client.createChatMessage(ACCESS_TOKEN, SERVER_ID, {
            clientRequestId: CLIENT_REQUEST_ID,
            contentText: "Hello realtime",
        }),
    ).resolves.toMatchObject({
        messageId: MESSAGE_ID,
        contentText: "Hello realtime",
    });
    expect(received.path).toBe(
        `/internal/realtime/servers/${SERVER_ID}/messages`,
    );
    expect(received.authorization).toBe(`Bearer ${ACCESS_TOKEN}`);
    expect(received.gatewayToken).toBe(GATEWAY_TOKEN);
    expect(received.body).toEqual({
        clientRequestId: CLIENT_REQUEST_ID,
        contentText: "Hello realtime",
    });
});
