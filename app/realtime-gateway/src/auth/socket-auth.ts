import type { Socket } from "socket.io";
import { extractAccessToken } from "./access-token";
import type { AuthenticatedSession } from "./authentication-access-token";
//validate session function. This will receive backend client.validate session token
type AuthenticateAccessToken = (
    accessToken: string,
) => Promise<AuthenticatedSession>;

type SocketNext = (error?: Error) => void;

type SocketAuthenticationError = Error & {
    data: {
        code: "UNAUTHENTICATED";
        message: string;
        retryable: false;
    };
};

function createUnauthenticatedError(): SocketAuthenticationError {
    const error = new Error("UNAUTHENTICATED") as SocketAuthenticationError;

    error.data = {
        code: "UNAUTHENTICATED",
        message: "Authentication required",
        retryable: false,
    };

    return error;
}

export function createSocketAuthMiddleware(
    authenticateAccessToken: AuthenticateAccessToken,
) {
    return async function socketAuthMiddleware(
        socket: Socket,
        next: SocketNext,
    ): Promise<void> {
        const accessToken = extractAccessToken(socket.handshake);

        if (!accessToken) {
            next(createUnauthenticatedError());
            return;
        }

        try {
            const authenticatedSession =
                await authenticateAccessToken(accessToken);

            socket.data.auth = {
                ...authenticatedSession,
                authorizedServerIds: new Set<string>(),
            };

            next();
        } catch {
            next(createUnauthenticatedError());
        }
    };
}
