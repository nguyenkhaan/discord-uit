import { io, type Socket } from 'socket.io-client';

const DEFAULT_REALTIME_URL = 'http://localhost:4001';

/** Path Socket.IO của gateway */
export const REALTIME_SOCKET_PATH = '/api/realtime/socket.io';

const realtimeUrl = String(
    import.meta.env.VITE_REALTIME_URL ?? DEFAULT_REALTIME_URL
).replace(/\/+$/, '');

let realtimeSocket: Socket | null = null;

/** Lấy kết nối Socket.IO dùng chung (xác thực bằng cookie) */
export function getRealtimeSocket(): Socket {
    realtimeSocket ??= io(realtimeUrl, {
        path: REALTIME_SOCKET_PATH,
        withCredentials: true,
        autoConnect: false,
    });
    return realtimeSocket;
}
