export type GatewayConfig = {
    port: number;
    springBaseUrl: string;
    gatewayServiceToken: string;
    frontendOrigin: string;
    socketIoPath: string;
    jwtIssuer: string;
    jwtAudience: string;
    jwtJwksUrl: string;
    kafkaBrokers: string[];
    kafkaClientId: string;
    kafkaGroupId: string;
    chatEventsTopic: string;
    chatRateLimitMaxMessages: number;
    chatRateLimitWindowMs: number;
};

function readRequired(name: string): string {
    const value = Bun.env[name]?.trim();

    if (!value) {
        throw new Error(`${name} is required`);
    }

    return value;
}

function readHttpUrl(name: string): string {
    const value = readRequired(name);

    try {
        const url = new URL(value);

        if (url.protocol !== "http:" && url.protocol !== "https:") {
            throw new Error();
        }

        return url.toString().replace(/\/+$/, "");
    } catch {
        throw new Error(`${name} must be a valid HTTP or HTTPS URL`);
    }
}

function readPort(): number {
    const port = Number(readRequired("PORT"));

    if (!Number.isInteger(port) || port <= 1 || port >= 65_535) {
        throw new Error("PORT must be between 2 and 65534");
    }

    return port;
}

function readGatewayServiceToken(): string {
    const token = Bun.env.GATEWAY_SERVICE_TOKEN;

    if (!token?.trim()) {
        throw new Error("GATEWAY_SERVICE_TOKEN is required");
    }

    if (token.length < 32) {
        throw new Error(
            "GATEWAY_SERVICE_TOKEN must contain at least 32 characters",
        );
    }

    return token;
}

function readKafkaBrokers(): string[] {
    const brokers = readRequired("KAFKA_BROKERS")
        .split(",")
        .map((broker) => broker.trim());

    if (brokers.some((broker) => broker.length === 0)) {
        throw new Error("KAFKA_BROKERS must contain valid broker addresses");
    }

    return brokers;
}

export function loadEnv(): GatewayConfig {
    return {
        port: readPort(),
        springBaseUrl: readHttpUrl("SPRING_BASE_URL"),
        gatewayServiceToken: readGatewayServiceToken(),
        frontendOrigin: readHttpUrl("FRONTEND_ORIGIN"),
        socketIoPath: readRequired("SOCKET_IO_PATH"),
        jwtIssuer: readRequired("JWT_ISSUER"),
        jwtAudience: readRequired("JWT_AUDIENCE"),
        jwtJwksUrl: readHttpUrl("JWT_JWKS_URL"),
        kafkaBrokers: readKafkaBrokers(),
        kafkaClientId: readRequired("KAFKA_CLIENT_ID"),
        kafkaGroupId: readRequired("KAFKA_GROUP_ID"),
        chatEventsTopic: readRequired("CHAT_EVENTS_TOPIC"),
        chatRateLimitMaxMessages: 5,
        chatRateLimitWindowMs: 10_000,
    };
}
