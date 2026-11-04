import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { createHealthRouter, ReadinessState } from "../health/health-router";

export type SocketServerConfig = {
    frontendOrigin: string;
    socketIoPath: string;
};

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

    return {
        httpServer,
        io,
        readiness,
    };
}
