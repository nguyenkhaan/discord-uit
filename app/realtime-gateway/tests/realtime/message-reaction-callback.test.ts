
import { afterEach, describe, expect, test } from "bun:test";
import type { AddressInfo } from "node:net";
import type { Server as HttpServer } from "node:http";
import {
    io as createClient,
    type Socket as ClientSocket,
} from "socket.io-client";
import type { Server as SocketServer } from "socket.io";

import { createSocketServer } from "../../src/socket/create-socket-server";
import { serverRoomName } from "../../src/socket/room-name";

const FRONTEND_ORIGIN = "http://localhost:5173";
const SOCKET_IO_PATH = "/api/realtime/socket.io";
const GATEWAY_TOKEN = "test-gateway-token";

const SERVER_ID = "0f8fad5b-d9cb-469f-a165-70867728950e";
const MESSAGE_ID = "11111111-1111-4111-8111-111111111111";
const ICON_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

let httpServer: HttpServer | undefined;
let io: SocketServer | undefined;
let client: ClientSocket | undefined;

async function startServer(): Promise<string> {
    const created = createSocketServer({
        frontendOrigin: FRONTEND_ORIGIN,
        socketIoPath: SOCKET_IO_PATH,
        gatewayServiceToken: GATEWAY_TOKEN,
    });

    httpServer = created.httpServer;
    io = created.io;

    await new Promise<void>((resolve) => {
        httpServer!.listen(0, "127.0.0.1", resolve);
    });

    const address = httpServer.address() as AddressInfo;

    return `http://127.0.0.1:${address.port}`;
}

function validPayload() {
    return {
        serverId: SERVER_ID,
        messageId: MESSAGE_ID,
        reactions: [
            {
                iconId: ICON_ID,
                iconImage: "like.png",
                name: "Like",
                count: 3,
            },
        ],
    };
}

async function postReactionEvent(
    baseUrl: string,
    payload: unknown,
    token?: string,
) {
    return fetch(
        `${baseUrl}/internal/realtime/events/message-reaction-updated`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token
                    ? { "X-Gateway-Token": token }
                    : {}),
            },
            body: JSON.stringify(payload),
        },
    );
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

describe("message reaction callback", () => {
    test("rejects request without gateway token", async () => {
        const baseUrl = await startServer();

        const response = await postReactionEvent(
            baseUrl,
            validPayload(),
        );

        expect(response.status).toBe(401);
        expect(await response.json()).toEqual({
            error: "UNAUTHORIZED",
        });
    });

    test("rejects request with invalid gateway token", async () => {
        const baseUrl = await startServer();

        const response = await postReactionEvent(
            baseUrl,
            validPayload(),
            "wrong-token",
        );

        expect(response.status).toBe(401);
        expect(await response.json()).toEqual({
            error: "UNAUTHORIZED",
        });
    });

    test("rejects invalid reaction payload", async () => {
        const baseUrl = await startServer();

        const invalidPayload = {
            ...validPayload(),
            unexpectedField: "not-allowed",
        };

        const response = await postReactionEvent(
            baseUrl,
            invalidPayload,
            GATEWAY_TOKEN,
        );

        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({
            error: "INVALID_PAYLOAD",
        });
    });

    test("broadcasts valid event to the corresponding server room", async () => {
        const baseUrl = await startServer();

        // Giả lập một client đã được đưa vào room tương ứng.
        io!.on("connection", (socket) => {
            void socket.join(serverRoomName(SERVER_ID));
        });

        client = createClient(baseUrl, {
            path: SOCKET_IO_PATH,
            transports: ["websocket"],
        });

        await new Promise<void>((resolve, reject) => {
            client!.once("connect", resolve);
            client!.once("connect_error", reject);
        });

        const receivedEvent = new Promise<unknown>((resolve) => {
            client!.once("message-reaction-updated", resolve);
        });

        const payload = validPayload();

        const response = await postReactionEvent(
            baseUrl,
            payload,
            GATEWAY_TOKEN,
        );

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            status: "ACCEPTED",
        });

        expect(await receivedEvent).toEqual(payload);
    });
});
