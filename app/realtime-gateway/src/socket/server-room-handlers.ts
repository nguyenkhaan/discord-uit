//Chua cac ham dung de xu ly viec leave/join room cua client

import type { Socket } from "socket.io";
import {
    BackendError,
    type BackendClient,
    type ServerAuthorizationResponse,
} from "../backend/backend-client";
import {
    ServerJoinCommandSchema,
    ServerLeaveCommandSchema,
    type SocketAck,
    type SocketError,
} from "../contracts/realtime";
import { serverRoomName } from "./room-name";

//Define type, may cai nay AI no lam cho :v
type RoomBackedClient = Pick<BackendClient, "authorizeServer">;
type Ack<T> = (result: SocketAck<T>) => void; //Day la 1 cai ham, no se chay
type LeaveResult = {
    serverId: string;
};

function errorAck(
    code: string,
    message: string,
    retryable: boolean,
): {
    ok: false;
    error: SocketError;
} {
    return {
        ok: false,
        error: {
            code,
            message,
            retryable,
        },
    };
}
export function registerServerRoomHandlers(
    socket: Socket,
    backendClient: RoomBackedClient,
) {
    //server join
    socket.on(
        "server-join",
        async (payload: unknown, ack: Ack<ServerAuthorizationResponse>) => {
            //Callback when the join room is calling
            const parsed = ServerJoinCommandSchema.safeParse(payload);
            if (!parsed.success) {
                ack(
                    errorAck(
                        "INVALID_PAYLOAD",
                        "Invalid server join command",
                        false,
                    ),
                );
                return;
            }
            const { serverId } = parsed.data;
            try {
                //Ben client, ack chinh la callback truyen vao, khi chay no thi se co ket qua tra ve cho bien response phia client
                //Phia client se truyen ack vao duoi dang 1 callback: (response) => { console.log(response) }
                const authorization = await backendClient.authorizeServer(
                    socket.data.auth.accessToken,
                    serverId,
                );
                await socket.join(serverRoomName(serverId));
                socket.data.auth.authorizedServerIds.add(serverId);
                ack({
                    ok: true,
                    data: authorization,
                });
                return;
            } catch (error) {
                if (
                    error instanceof BackendError &&
                    error.reason === "http-error" &&
                    error.status === 404
                ) {
                    ack(
                        errorAck(
                            "NOT_A_MEMBER",
                            "You are not a member of this server",
                            false,
                        ),
                    );
                    return;
                }

                if (error instanceof BackendError) {
                    ack(
                        errorAck(
                            "BACKEND_UNAVAILABLE",
                            "Server authorization is temporarily unavailable",
                            true,
                        ),
                    );
                    return;
                }

                ack(errorAck("INTERNAL_ERROR", "Could not join server", false));
            }
        },
    );

    //server leave
    socket.on(
        "server-leave",
        async (payload: unknown, ack: Ack<LeaveResult>) => {
            const parsed = ServerLeaveCommandSchema.safeParse(payload);
            if (!parsed.success) {
                ack(
                    errorAck(
                        "INVALID_PAYLOAD",
                        "Invalid server command",
                        false,
                    ),
                );
                return;
            }
            const { serverId } = parsed.data;
            try {
                await socket.leave(serverRoomName(serverId));
                socket.data.auth.authorizedServerIds.delete(serverId);
                ack({
                    ok: true,
                    data: { serverId },
                });
            } catch (error) {
                ack(
                    errorAck("INTERNAL_ERROR", "Could not leave server", false),
                );
                return;
            }
        },
    );
}
