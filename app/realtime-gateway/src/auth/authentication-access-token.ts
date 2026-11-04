import type { VerifiedAccessToken } from "./jwt-verify";
import type { SessionValidationResponse } from "../backend/backend-client";

type VerifyAccessToken = (token: string) => Promise<VerifiedAccessToken>;

type ValidateSession = (token: string) => Promise<SessionValidationResponse>;

export type AuthenticatedSession = {
    accessToken: string;
    userId: string;
    sessionId: string;
};

export class AuthenticationError extends Error {
    constructor() {
        super("Authentication failed");
        this.name = "AuthenticationError";
    }
}

export function createAccessTokenAuthenticator(
    verifyAccessToken: VerifyAccessToken,
    validateSession: ValidateSession,
    //Nhan vao 2 decorator function, su dung 2 ham nay (ham ben trong jwt-verify va ham validate session ben trong session-validate response)
) {
    return async function authenticateAccessToken(accessToken: string) {
        try {
            //Calling the function to verifyy jwt token with public key received from backend
            const verifiedToken = await verifyAccessToken(accessToken);
            //Calling to BE to validate session
            const validatedSession = await validateSession(accessToken);
            //Checking the validated session with current information
            const userMatches =
                verifiedToken.userId === validatedSession.userId;
            //Whether the session id is macthes?
            const sessionMatches =
                verifiedToken.sessionId === validatedSession.sessionId;

            if (!userMatches || !sessionMatches) {
                throw new AuthenticationError();
            }

            return {
                accessToken,
                userId: verifiedToken.userId,
                sessionId: verifiedToken.sessionId,
            };
        } catch {
            throw new AuthenticationError();
        }
    };
}
