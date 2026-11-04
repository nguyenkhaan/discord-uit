import { createRemoteJWKSet, decodeProtectedHeader, jwtVerify } from "jose";
import { z } from "zod";

type JwtVerifyConfig = {
    jwtIssuer: string;
    jwtAudience: string;
    jwtJwksUrl: string;
};
export type VerifiedAccessToken = {
    userId: string;
    sessionId: string;
    tokenId: string;
};
const AccessTokenClaimsSchema = z.object({
    sub: z.guid(),
    sid: z.guid(),
    jti: z.guid(),
    exp: z.number(),
});

export function createJwtVerifier(
    config: JwtVerifyConfig,
): (token: string) => Promise<VerifiedAccessToken> {
    const jwks = createRemoteJWKSet(new URL(config.jwtJwksUrl));

    return async function verifyAccessToken(
        token: string,
    ): Promise<VerifiedAccessToken> {
        const header = decodeProtectedHeader(token);

        if (
            header.alg !== "RS256" ||
            typeof header.kid !== "string" ||
            header.kid.trim().length === 0
        ) {
            throw new Error("Invalid access token header");
        }

        const { payload } = await jwtVerify(token, jwks, {
            algorithms: ["RS256"],
            issuer: config.jwtIssuer,
            audience: config.jwtAudience,
            requiredClaims: ["exp", "sub", "sid", "jti"],
        });

        const claims = AccessTokenClaimsSchema.parse(payload);

        return {
            userId: claims.sub,
            sessionId: claims.sid,
            tokenId: claims.jti,
        };
    };
}
