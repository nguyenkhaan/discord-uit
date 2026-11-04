import { expect, mock, test } from "bun:test";
import type { Server, Socket } from "socket.io";
import type { BackendClient } from "../../src/backend/backend-client";
import { BackendError } from "../../src/backend/backend-client";
import type { ChatRateLimiter } from "../../src/socket/chat-rate-limiter";
import { registerChatHandlers } from "../../src/socket/chat-handlers";

const SERVER_ID = "0f8fad5b-d9cb-469f-a165-70867728950e";
const USER_ID = "491f5207-70b2-4c02-8d09-6d8d4e1c76d7";
const CLIENT_REQUEST_ID = "7f9c1ad4-6a85-4b62-b55a-dfaee22fd301";
const ACCESS_TOKEN = "signed-access-token";
const MESSAGE = {
    messageId: "a22c974b-1c2e-40cc-b328-63d17adc90c1",
    serverId: SERVER_ID,
    senderUserId: USER_ID,
    clientRequestId: CLIENT_REQUEST_ID,
    contentText: "Hello realtime",
    createdAt: "2026-11-05T03:00:00Z",
};

type Ack = (value: unknown) => void;
type Handler = (payload: unknown, ack: Ack) => void | Promise<void>;

function fakeContext(joined = true) {
    const handlers = new Map<string, Handler>();
    const authorizedServerIds = new Set<string>();
    const broadcasts: Array<{ room: string; event: string; data: unknown }> =
        [];
    const leftRooms: string[] = [];

    if (joined) {
        authorizedServerIds.add(SERVER_ID);
    }

    const socket = {
        data: {
            auth: {
                accessToken: ACCESS_TOKEN,
                userId: USER_ID,
                sessionId: "b61d5a51-a4ea-45c8-9cb8-00d72d9f9c20",
                authorizedServerIds,
            },
        },
        on(event: string, handler: Handler) {
            handlers.set(event, handler);
            return socket;
        },
        async leave(room: string) {
            leftRooms.push(room);
        },
    };
    const io = {
        to(room: string) {
            return {
                emit(event: string, data: unknown) {
                    broadcasts.push({ room, event, data });
                },
            };
        },
    };

    async function emit(payload: unknown) {
        const handler = handlers.get("chat-send");
        if (!handler) {
            throw new Error("Missing chat-send handler");
        }

        const acknowledgements: unknown[] = [];
        await handler(payload, (value) => acknowledgements.push(value));
        return acknowledgements;
    }

    return {
        socket: socket as unknown as Socket,
        io: io as unknown as Server,
        emit,
        authorizedServerIds,
        broadcasts,
        leftRooms,
    };
}

function allowedLimiter() {
    return {
        tryConsume: mock(() => true),
    } as Pick<ChatRateLimiter, "tryConsume">;
}

test("persists once then ACKs and broadcasts exactly the Spring DTO", async () => {
    const createChatMessage = mock(async () => MESSAGE);
    const context = fakeContext();
    registerChatHandlers(
        context.socket,
        context.io,
        { createChatMessage } as Pick<BackendClient, "createChatMessage">,
        allowedLimiter(),
    );

    const acknowledgements = await context.emit({
        serverId: SERVER_ID,
        clientRequestId: CLIENT_REQUEST_ID,
        contentText: "  Hello realtime  ",
    });

    expect(createChatMessage).toHaveBeenCalledWith(ACCESS_TOKEN, SERVER_ID, {
        clientRequestId: CLIENT_REQUEST_ID,
        contentText: "Hello realtime",
    });
    expect(acknowledgements).toEqual([{ ok: true, data: MESSAGE }]);
    expect(context.broadcasts).toEqual([
        {
            room: `server:${SERVER_ID}`,
            event: "chat-created",
            data: MESSAGE,
        },
    ]);
});

test("rejects a message for a server the socket has not joined", async () => {
    const createChatMessage = mock(async () => MESSAGE);
    const context = fakeContext(false);
    registerChatHandlers(
        context.socket,
        context.io,
        { createChatMessage } as Pick<BackendClient, "createChatMessage">,
        allowedLimiter(),
    );

    const acknowledgements = await context.emit({
        serverId: SERVER_ID,
        clientRequestId: CLIENT_REQUEST_ID,
        contentText: "Hello",
    });

    expect(createChatMessage).not.toHaveBeenCalled();
    expect(acknowledgements).toMatchObject([
        { ok: false, error: { code: "NOT_A_MEMBER", retryable: false } },
    ]);
});

test("rejects an invalid command before checking membership or Spring", async () => {
    const createChatMessage = mock(async () => MESSAGE);
    const limiter = allowedLimiter();
    const context = fakeContext();
    registerChatHandlers(
        context.socket,
        context.io,
        { createChatMessage } as Pick<BackendClient, "createChatMessage">,
        limiter,
    );

    const acknowledgements = await context.emit({
        serverId: SERVER_ID,
        clientRequestId: "not-a-uuid",
        contentText: "Hello",
    });

    expect(createChatMessage).not.toHaveBeenCalled();
    expect(limiter.tryConsume).not.toHaveBeenCalled();
    expect(acknowledgements).toMatchObject([
        { ok: false, error: { code: "INVALID_PAYLOAD", retryable: false } },
    ]);
});

test("rejects a rate-limited message before calling Spring", async () => {
    const createChatMessage = mock(async () => MESSAGE);
    const limiter = {
        tryConsume: mock(() => false),
    } as Pick<ChatRateLimiter, "tryConsume">;
    const context = fakeContext();
    registerChatHandlers(
        context.socket,
        context.io,
        { createChatMessage } as Pick<BackendClient, "createChatMessage">,
        limiter,
    );

    const acknowledgements = await context.emit({
        serverId: SERVER_ID,
        clientRequestId: CLIENT_REQUEST_ID,
        contentText: "Hello",
    });

    expect(createChatMessage).not.toHaveBeenCalled();
    expect(acknowledgements).toMatchObject([
        { ok: false, error: { code: "RATE_LIMITED", retryable: true } },
    ]);
});

test("maps revoked membership to NOT_A_MEMBER without broadcasting", async () => {
    const createChatMessage = mock(async () => {
        throw new BackendError("http-error", 404);
    });
    const context = fakeContext();
    registerChatHandlers(
        context.socket,
        context.io,
        { createChatMessage } as Pick<BackendClient, "createChatMessage">,
        allowedLimiter(),
    );

    const acknowledgements = await context.emit({
        serverId: SERVER_ID,
        clientRequestId: CLIENT_REQUEST_ID,
        contentText: "Hello",
    });

    expect(acknowledgements).toMatchObject([
        { ok: false, error: { code: "NOT_A_MEMBER", retryable: false } },
    ]);
    expect(context.broadcasts).toEqual([]);
    expect(context.authorizedServerIds.has(SERVER_ID)).toBe(false);
    expect(context.leftRooms).toEqual([`server:${SERVER_ID}`]);
});

test("maps a Spring outage to retryable BACKEND_UNAVAILABLE", async () => {
    const createChatMessage = mock(async () => {
        throw new BackendError("http-error", 503);
    });
    const context = fakeContext();
    registerChatHandlers(
        context.socket,
        context.io,
        { createChatMessage } as Pick<BackendClient, "createChatMessage">,
        allowedLimiter(),
    );

    const acknowledgements = await context.emit({
        serverId: SERVER_ID,
        clientRequestId: CLIENT_REQUEST_ID,
        contentText: "Hello",
    });

    expect(acknowledgements).toMatchObject([
        {
            ok: false,
            error: { code: "BACKEND_UNAVAILABLE", retryable: true },
        },
    ]);
    expect(context.broadcasts).toEqual([]);
});
