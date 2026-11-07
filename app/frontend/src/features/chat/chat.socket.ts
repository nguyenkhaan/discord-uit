import type { Socket } from 'socket.io-client';

import type {
    ChatMessageDto,
    ChatSendCommand,
    ServerRoomAuthorization,
    ServerRoomCommand,
    SocketAck,
} from '@/features/chat/chat.type';

/** Tên các event socket */
export const CHAT_EVENTS = {
    serverJoin: 'server-join',
    serverLeave: 'server-leave',
    chatSend: 'chat-send',
    chatCreated: 'chat-created',
} as const;

const ACK_TIMEOUT_MS = 10_000;

/** Gửi event và chờ ACK, quá hạn thì trả lỗi TIMEOUT */
async function emitWithAck<TData>(
    socket: Socket,
    event: string,
    payload: unknown
): Promise<SocketAck<TData>> {
    try {
        return await socket.timeout(ACK_TIMEOUT_MS).emitWithAck(event, payload);
    } catch {
        return {
            ok: false,
            error: {
                code: 'TIMEOUT',
                message: 'Realtime gateway did not respond',
                retryable: true,
            },
        };
    }
}

export function joinServerRoom(
    socket: Socket,
    command: ServerRoomCommand
): Promise<SocketAck<ServerRoomAuthorization>> {
    return emitWithAck(socket, CHAT_EVENTS.serverJoin, command);
}

export function leaveServerRoom(
    socket: Socket,
    command: ServerRoomCommand
): Promise<SocketAck<ServerRoomCommand>> {
    return emitWithAck(socket, CHAT_EVENTS.serverLeave, command);
}

export function sendChatMessage(
    socket: Socket,
    command: ChatSendCommand
): Promise<SocketAck<ChatMessageDto>> {
    return emitWithAck(socket, CHAT_EVENTS.chatSend, command);
}
