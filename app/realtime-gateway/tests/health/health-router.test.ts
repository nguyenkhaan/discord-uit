import { afterEach, describe, expect, test } from "bun:test";
import type { AddressInfo } from "node:net";
import type { Server as HttpServer } from "node:http";
import type { Server as SocketServer } from "socket.io";
import { createSocketServer } from "../../src/socket/create-socket-server";

const FRONTEND_ORIGIN = "http://localhost:5173";
const SOCKET_IO_PATH = "/api/realtime/socket.io";

let httpServer: HttpServer | undefined;
let io: SocketServer | undefined;

async function listen(): Promise<{
    baseUrl: string;
    readiness: ReturnType<typeof createSocketServer>["readiness"];
}> {
    const socketServer = createSocketServer({
        frontendOrigin: "http://localhost:5173",
        socketIoPath: SOCKET_IO_PATH,
        gatewayServiceToken: "test-gateway-token",
    });

    httpServer = socketServer.httpServer;
    io = socketServer.io;

    await new Promise<void>((resolve) => {
        httpServer!.listen(0, "127.0.0.1", resolve);
    });

    const address = httpServer.address() as AddressInfo;

    return {
        baseUrl: `http://127.0.0.1:${address.port}`,
        readiness: socketServer.readiness,
    };
}

afterEach(async () => {
    if (io) {
        await new Promise<void>((resolve) => io!.close(() => resolve()));
    }

    io = undefined;
    httpServer = undefined;
});

describe("gateway health", () => {
    test("reports liveness independently from readiness", async () => {
        const { baseUrl } = await listen();

        const response = await fetch(`${baseUrl}/live`);

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ status: "UP" });
    });

    test("reports not ready until startup dependencies initialize", async () => {
        const { baseUrl, readiness } = await listen();

        expect((await fetch(`${baseUrl}/ready`)).status).toBe(503);

        readiness.markReady();

        expect((await fetch(`${baseUrl}/ready`)).status).toBe(200);
    });
});

describe("Socket.IO transport", () => {
    test("uses the configured path and credentialed frontend origin", async () => {
        const { baseUrl } = await listen();
        const handshakeUrl = `${baseUrl}${SOCKET_IO_PATH}/?EIO=4&transport=polling`;

        const response = await fetch(handshakeUrl, {
            headers: { Origin: FRONTEND_ORIGIN },
        });

        expect(response.status).toBe(200);
        expect(response.headers.get("access-control-allow-origin")).toBe(
            FRONTEND_ORIGIN,
        );
        expect(response.headers.get("access-control-allow-credentials")).toBe(
            "true",
        );
        expect(
            (await fetch(`${baseUrl}/socket.io/?EIO=4&transport=polling`))
                .status,
        ).toBe(404);
    });
});
