import { afterEach, beforeEach, expect, test } from "bun:test";
import { loadEnv } from "../../src/config/env";

const TEST_ENV = {
    PORT: "3001",
    SPRING_BASE_URL: "http://localhost:8080/api",
    GATEWAY_SERVICE_TOKEN: "a".repeat(32),
    FRONTEND_ORIGIN: "http://localhost:5173",
    SOCKET_IO_PATH: "/api/realtime/socket.io",
    JWT_ISSUER: "uit-connect",
    JWT_AUDIENCE: "uit-connect-realtime",
    JWT_JWKS_URL: "http://localhost:8080/api/.well-known/jwks.json",
} as const;

type TestEnvKey = keyof typeof TEST_ENV;

const originalValues = new Map<TestEnvKey, string | undefined>();

beforeEach(() => {
    for (const [key, value] of Object.entries(TEST_ENV)) {
        const envKey = key as TestEnvKey;
        originalValues.set(envKey, Bun.env[envKey]);
        Bun.env[envKey] = value;
    }
});

afterEach(() => {
    for (const key of Object.keys(TEST_ENV) as TestEnvKey[]) {
        const originalValue = originalValues.get(key);

        if (originalValue === undefined) {
            delete Bun.env[key];
        } else {
            Bun.env[key] = originalValue;
        }
    }

    originalValues.clear();
});

test("rejects configuration without JWT_JWKS_URL", () => {
    delete Bun.env.JWT_JWKS_URL;

    expect(() => loadEnv()).toThrow("JWT_JWKS_URL");
});

test("loads realtime configuration and fixed chat limit defaults", () => {
    expect(loadEnv()).toEqual({
        port: 3001,
        springBaseUrl: "http://localhost:8080/api",
        gatewayServiceToken: "a".repeat(32),
        frontendOrigin: "http://localhost:5173",
        socketIoPath: "/api/realtime/socket.io",
        jwtIssuer: "uit-connect",
        jwtAudience: "uit-connect-realtime",
        jwtJwksUrl: "http://localhost:8080/api/.well-known/jwks.json",
        chatRateLimitMaxMessages: 5,
        chatRateLimitWindowMs: 10_000,
    });
});
