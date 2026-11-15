import express from "express";
import { createServer } from "node:http";
import { timingSafeEqual } from "node:crypto";
import { Server } from "socket.io";

import { MessageReactionUpdatedEventSchema } from "../contracts/realtime";
import { createHealthRouter, ReadinessState } from "../health/health-router";
import { serverRoomName } from "./room-name";

export type SocketServerConfig = {
    frontendOrigin: string;
    socketIoPath: string;
    gatewayServiceToken: string;
};

function isValidGatewayToken(
    receivedToken: string | undefined,
    expectedToken: string,
): boolean {
    if (!receivedToken) {
        return false;
    }

    const received = Buffer.from(receivedToken);
    const expected = Buffer.from(expectedToken);

    if (received.length !== expected.length) {
        return false;
    }

    return timingSafeEqual(received, expected);
}

export function createSocketServer(config: SocketServerConfig) {
    const app = express();
    const httpServer = createServer(app);
    const readiness = new ReadinessState();

    
    app.use(createHealthRouter(readiness));

    const io = new Server(httpServer, {
        path: config.socketIoPath,
        cors: {
            origin: config.frontendOrigin,
            credentials: true,
        },
    });

    app.post(
    "/internal/realtime/events/message-reaction-updated",
    express.json({ limit: "32kb" }),
    (request, response) => {
            const receivedToken = request.header("X-Gateway-Token");

            if (
                !isValidGatewayToken(receivedToken, config.gatewayServiceToken)
            ) {
                response.status(401).json({
                    error: "UNAUTHORIZED",
                });
                return;
            }

            const parsed = MessageReactionUpdatedEventSchema.safeParse(
                request.body,
            );

            if (!parsed.success) {
                response.status(400).json({
                    error: "INVALID_PAYLOAD",
                });
                return;
            }

            const event = parsed.data;

            io.to(serverRoomName(event.serverId)).emit(
                "message-reaction-updated",
                event,
            );

            response.status(200).json({
                status: "ACCEPTED",
            });
        },
    );

    return {
        httpServer,
        io,
        readiness,
    };
}
