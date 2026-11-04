import { BackendError } from "../backend/backend-client";
import type { SocketError } from "../contracts/realtime";

export type SocketFailure = {
    ok: false;
    error: SocketError;
};

export function socketFailure(
    code: string,
    message: string,
    retryable: boolean,
): SocketFailure {
    return {
        ok: false,
        error: {
            code,
            message,
            retryable,
        },
    };
}

export function mapBackendError(error: unknown): SocketFailure {
    if (
        error instanceof BackendError &&
        error.reason === "http-error" &&
        error.status === 404
    ) {
        return socketFailure(
            "NOT_A_MEMBER",
            "You are not a member of this server",
            false,
        );
    }

    if (
        error instanceof BackendError &&
        (error.reason === "unreachable" ||
            error.reason === "invalid-response" ||
            (error.status !== undefined && error.status >= 500))
    ) {
        return socketFailure(
            "BACKEND_UNAVAILABLE",
            "Chat service is temporarily unavailable",
            true,
        );
    }

    if (
        error instanceof BackendError &&
        error.reason === "http-error" &&
        error.status === 401
    ) {
        return socketFailure(
            "UNAUTHENTICATED",
            "Authentication required",
            false,
        );
    }

    return socketFailure(
        "INTERNAL_ERROR",
        "Could not send chat message",
        false,
    );
}
