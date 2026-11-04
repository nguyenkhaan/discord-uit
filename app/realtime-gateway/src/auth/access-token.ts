import { parseCookie } from "cookie";

type TokenHandshake = {
    headers: {
        cookie?: string;
    };
    auth?: Record<string, unknown>;
    query?: Record<string, unknown>;
};

export function extractAccessToken(handshake: TokenHandshake): string | null {
    const cookieHeader = handshake.headers.cookie;

    if (cookieHeader) {
        const cookies = parseCookie(cookieHeader);
        const cookieToken = cookies.access_token;

        if (cookieToken?.trim()) {
            return cookieToken;
        }
    }

    const authToken = handshake.auth?.accessToken;

    if (typeof authToken === "string" && authToken.trim().length > 0) {
        return authToken;
    }

    return null;
}
