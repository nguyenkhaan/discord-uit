import { createAccessTokenAuthenticator } from "./src/auth/authentication-access-token";
import { createJwtVerifier } from "./src/auth/jwt-verify";
import { createSocketAuthMiddleware } from "./src/auth/socket-auth";
import { BackendClient } from "./src/backend/backend-client";
import { loadEnv } from "./src/config/env";
import { createSocketServer } from "./src/socket/create-socket-server";

async function main() {
    const envConfigs = loadEnv();
    const backendClient = new BackendClient(
        envConfigs.springBaseUrl,
        envConfigs.gatewayServiceToken,
    );
    const health = await backendClient.checkInternalHealth();
    if (!health.healthy) {
        console.error(
            [
                "Spring Boot connection failed",
                `reason=${health.reason}`,
                `status=${health.status ?? "none"}`,
            ].join("; "),
        );
        process.exitCode = 1;
        return;
    }

    const verifyAccessToken = createJwtVerifier({
        jwtIssuer: envConfigs.jwtIssuer,
        jwtAudience: envConfigs.jwtAudience,
        jwtJwksUrl: envConfigs.jwtJwksUrl,
    });

    const authenticateAccessToken = createAccessTokenAuthenticator(
        verifyAccessToken,
        backendClient.validateSession.bind(backendClient),
    );

    const { httpServer, io, readiness } = createSocketServer(envConfigs);

    io.use(createSocketAuthMiddleware(authenticateAccessToken));

    await new Promise<void>((resolve, reject) => {
        const handleError = (error: Error) => {
            reject(error);
        };

        httpServer.once("error", handleError);

        httpServer.listen(envConfigs.port, "0.0.0.0", () => {
            httpServer.off("error", handleError);
            resolve();
        });
    });
    readiness.markReady();
    console.log(`Realtime gateway is listening on port ${envConfigs.port}`);
}

main().catch((error: unknown) => {
    const message =
        error instanceof Error ? error.message : "Unknown startup error";

    console.error(`Realtime gateway failed to start: ${message}`);
    process.exitCode = 1;
});
