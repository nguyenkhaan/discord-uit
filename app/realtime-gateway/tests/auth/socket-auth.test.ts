import { afterEach, expect, test } from "bun:test";
import type { AddressInfo } from "node:net";
import {
    io as createClient,
    type Socket as ClientSocket,
} from "socket.io-client";
import type { Server as SocketServer } from "socket.io";
import type { Server as HttpServer } from "node:http";
import { createSocketAuthMiddleware } from "../../src/auth/socket-auth";
import { createSocketServer } from "../../src/socket/create-socket-server";

const SOCKET_IO_PATH = "/api/realtime/socket.io";
const ACCESS_TOKEN = "signed-access-token";
const USER_ID = "0f8fad5b-d9cb-469f-a165-70867728950e";
const SESSION_ID = "7c9e6679-7425-40de-944b-e07fc1f90ae7";

let httpServer: HttpServer | undefined;
let io: SocketServer | undefined;
let client: ClientSocket | undefined;

async function startServer(
    authenticate: (accessToken: string) => Promise<{
        accessToken: string;
        userId: string;
        sessionId: string;
    }>,
): Promise<string> {
    const created = createSocketServer({
        frontendOrigin: "http://localhost:5173",
        socketIoPath: SOCKET_IO_PATH,
        gatewayServiceToken: "test-gateway-token",
    });

    httpServer = created.httpServer;
    io = created.io;
    io.use(createSocketAuthMiddleware(authenticate));

    await new Promise<void>((resolve) => {
        httpServer!.listen(0, "127.0.0.1", resolve);
    });

    const address = httpServer.address() as AddressInfo;
    return `http://127.0.0.1:${address.port}`;
}

afterEach(async () => {
    client?.disconnect();

    if (io) {
        await new Promise<void>((resolve) => io!.close(() => resolve()));
    }

    client = undefined;
    io = undefined;
    httpServer = undefined;
});

test("stores the authenticated session in socket data", async () => {
    const url = await startServer(async (accessToken) => ({
        accessToken,
        userId: USER_ID,
        sessionId: SESSION_ID,
    }));

    const authenticated = new Promise<unknown>((resolve) => {
        io!.once("connection", (socket) => resolve(socket.data.auth));
    });

    client = createClient(url, {
        path: SOCKET_IO_PATH,
        transports: ["websocket"],
        auth: { accessToken: ACCESS_TOKEN },
    });

    const auth = await authenticated;

    expect(auth).toMatchObject({
        accessToken: ACCESS_TOKEN,
        userId: USER_ID,
        sessionId: SESSION_ID,
    });
    expect(
        (auth as { authorizedServerIds: Set<string> }).authorizedServerIds,
    ).toBeInstanceOf(Set);
});

test("rejects a handshake without an access token", async () => {
    const url = await startServer(async () => {
        throw new Error("should not be called");
    });

    client = createClient(url, {
        path: SOCKET_IO_PATH,
        transports: ["websocket"],
    });

    const error = await new Promise<Error & { data?: unknown }>((resolve) => {
        client!.once("connect_error", resolve);
    });

    expect(error.message).toBe("UNAUTHENTICATED");
    expect(error.data).toEqual({
        code: "UNAUTHENTICATED",
        message: "Authentication required",
        retryable: false,
    });
});

test("sanitizes authentication failures", async () => {
    const url = await startServer(async () => {
        throw new Error("sensitive backend response");
    });

    client = createClient(url, {
        path: SOCKET_IO_PATH,
        transports: ["websocket"],
        auth: { accessToken: ACCESS_TOKEN },
    });

    const error = await new Promise<Error & { data?: unknown }>((resolve) => {
        client!.once("connect_error", resolve);
    });

    expect(error.message).toBe("UNAUTHENTICATED");
    expect(JSON.stringify(error.data)).not.toContain("backend response");
});
