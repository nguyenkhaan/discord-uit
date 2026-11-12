import type { Server, Socket } from "socket.io";
import type { BackendClient } from "../backend/backend-client";
import {
    ChatSendCommandSchema,
    type ChatMessageDto,
    type SocketAck,
} from "../contracts/realtime";
import type { ChatRateLimiter } from "./chat-rate-limiter";
import { mapBackendError, socketFailure } from "./socket-error-mapper";
import { serverRoomName } from "./room-name";

type ChatBackendClient = Pick<BackendClient, "createChatMessage">;
type Limiter = Pick<ChatRateLimiter, "tryConsume">;
type Ack = (result: SocketAck<ChatMessageDto>) => void;

export function registerChatHandlers(
    socket: Socket,
    io: Server,
    backendClient: ChatBackendClient,
    limiter: Limiter,
): void {
    socket.on(
        "chat-send",
        async (payload: unknown, ack: Ack): Promise<void> => {
            if (typeof ack !== "function") {
                return;
            }

            const parsed = ChatSendCommandSchema.safeParse(payload);

            if (!parsed.success) {
                ack(
                    socketFailure(
                        "INVALID_PAYLOAD",
                        "Invalid chat command",
                        false,
                    ),
                );
                return;
            }

            const command = parsed.data;
            const auth = socket.data.auth;

            if (!auth.authorizedServerIds.has(command.serverId)) {
                ack(
                    socketFailure(
                        "NOT_A_MEMBER",
                        "Join the server before sending messages",
                        false,
                    ),
                );
                return;
            }

            if (!limiter.tryConsume(auth.userId)) {
                ack(
                    socketFailure(
                        "RATE_LIMITED",
                        "Too many chat messages",
                        true,
                    ),
                );
                return;
            }

            let message: ChatMessageDto;

            //try/catch chi bao quanh backend call. Neu emit() nam trong cung try sau khi da ACK,
            //mot loi broadcast co the di vao catch va goi ACK lan thu hai
            try {
                message = await backendClient.createChatMessage(
                    auth.accessToken,
                    command.serverId,
                    {
                        clientRequestId: command.clientRequestId,
                        contentText: command.contentText,
                        // Chỉ gửi khi có reply
                        ...(command.replyToMessageId
                            ? { replyToMessageId: command.replyToMessageId }
                            : {}),
                        // Chỉ gửi khi có ảnh
                        ...(command.attachmentMediaIds?.length
                            ? { attachmentMediaIds: command.attachmentMediaIds }
                            : {}),
                    },
                );
            } catch (error) {
                const failure = mapBackendError(error);

                if (failure.error.code === "NOT_A_MEMBER") {
                    auth.authorizedServerIds.delete(command.serverId);

                    try {
                        await socket.leave(serverRoomName(command.serverId));
                    } catch {
                        // Authorization state is already removed locally.
                    }
                }

                ack(failure);
                return;
            }

            // ACK confirms that Spring persisted the message.
            ack({
                ok: true,
                data: message,
            });

            // Broadcast uses only the trusted DTO returned by Spring.
            io.to(serverRoomName(command.serverId)).emit(
                "chat-created",
                message,
            );
        },
    );
}
