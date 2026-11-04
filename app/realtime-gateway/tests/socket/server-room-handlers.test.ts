import { expect, mock, test } from "bun:test";
import type { Socket } from "socket.io";
import type { BackendClient } from "../../src/backend/backend-client";
import { BackendError } from "../../src/backend/backend-client";
import { registerServerRoomHandlers } from "../../src/socket/server-room-handlers";

const SERVER_ID = "0f8fad5b-d9cb-469f-a165-70867728950e";
const ACCESS_TOKEN = "signed-access-token";

type Ack = (value: unknown) => void;
type Handler = (payload: unknown, ack: Ack) => void | Promise<void>;

function fakeSocket() {
    const handlers = new Map<string, Handler>();
    const joinedRooms: string[] = [];
    const leftRooms: string[] = [];
    const authorizedServerIds = new Set<string>();

    const socket = {
        data: {
            auth: {
                accessToken: ACCESS_TOKEN,
                userId: "00000000-0000-0000-0000-000000000001",
                sessionId: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
                authorizedServerIds,
            },
        },
        on(event: string, handler: Handler) {
            handlers.set(event, handler);
            return socket;
        },
        async join(room: string) {
            joinedRooms.push(room);
        },
        async leave(room: string) {
            leftRooms.push(room);
        },
    };

    async function emit(event: string, payload: unknown): Promise<any> {
        const handler = handlers.get(event);
        if (!handler) {
            throw new Error(`Missing handler for ${event}`);
        }

        return await new Promise((resolve) => {
            void handler(payload, resolve);
        });
    }

    return {
        socket: socket as unknown as Socket,
        emit,
        joinedRooms,
        leftRooms,
        authorizedServerIds,
    };
}

test("authorizes an active member before joining the generated room", async () => {
    const authorizeServer = mock(async () => ({
        serverId: SERVER_ID,
        role: "MEMBER" as const,
    }));
    const backendClient = { authorizeServer } as Pick<
        BackendClient,
        "authorizeServer"
    >;
    const context = fakeSocket();
    registerServerRoomHandlers(context.socket, backendClient);

    const ack = await context.emit("server-join", { serverId: SERVER_ID });

    expect(authorizeServer).toHaveBeenCalledWith(ACCESS_TOKEN, SERVER_ID);
    expect(context.joinedRooms).toEqual([`server:${SERVER_ID}`]);
    expect(context.authorizedServerIds.has(SERVER_ID)).toBe(true);
    expect(ack).toEqual({
        ok: true,
        data: { serverId: SERVER_ID, role: "MEMBER" },
    });
});

test("rejects invalid payload before calling Spring", async () => {
    const authorizeServer = mock(async () => ({
        serverId: SERVER_ID,
        role: "MEMBER" as const,
    }));
    const context = fakeSocket();
    registerServerRoomHandlers(context.socket, { authorizeServer } as Pick<
        BackendClient,
        "authorizeServer"
    >);

    const ack = await context.emit("server-join", {
        serverId: "not-a-uuid",
    });

    expect(authorizeServer).not.toHaveBeenCalled();
    expect(context.joinedRooms).toEqual([]);
    expect(ack).toMatchObject({
        ok: false,
        error: { code: "INVALID_PAYLOAD", retryable: false },
    });
});

test("maps Spring 404 to NOT_A_MEMBER without joining", async () => {
    const authorizeServer = mock(async () => {
        throw new BackendError("http-error", 404);
    });
    const context = fakeSocket();
    registerServerRoomHandlers(context.socket, { authorizeServer } as Pick<
        BackendClient,
        "authorizeServer"
    >);

    const ack = await context.emit("server-join", { serverId: SERVER_ID });

    expect(context.joinedRooms).toEqual([]);
    expect(context.authorizedServerIds.has(SERVER_ID)).toBe(false);
    expect(ack).toMatchObject({
        ok: false,
        error: { code: "NOT_A_MEMBER", retryable: false },
    });
});

test("leaves the generated room and clears authorization state", async () => {
    const context = fakeSocket();
    context.authorizedServerIds.add(SERVER_ID);
    registerServerRoomHandlers(context.socket, {
        authorizeServer: mock(async () => {
            throw new Error("not used");
        }),
    } as Pick<BackendClient, "authorizeServer">);

    const ack = await context.emit("server-leave", { serverId: SERVER_ID });

    expect(context.leftRooms).toEqual([`server:${SERVER_ID}`]);
    expect(context.authorizedServerIds.has(SERVER_ID)).toBe(false);
    expect(ack).toEqual({
        ok: true,
        data: { serverId: SERVER_ID },
    });
});
