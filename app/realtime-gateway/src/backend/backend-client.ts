import { z } from "zod";
import {
    ChatMessageDtoSchema,
    type ChatMessageDto,
    type ChatSendCommand,
} from "../contracts/realtime";

const DEFAULT_TIMEOUT = 2500;

const SessionValidationResponseSchema = z
    .object({
        userId: z.guid(),
        sessionId: z.guid(),
        accountStatus: z.literal("ACTIVE"),
    })
    .strict();

export type SessionValidationResponse = z.infer<
    typeof SessionValidationResponseSchema
>;

export type BackendErrorReason =
    "http-error" | "unreachable" | "invalid-response";

export class BackendError extends Error {
    constructor(
        public readonly reason: BackendErrorReason,
        public readonly status?: number,
    ) {
        super(`Backend request failed: ${reason}`);
        this.name = "BackendError";
    }
}

const ServerAuthorizationResponseSchema = z
    .object({
        serverId: z.guid(),
        role: z.enum(["OWNER", "MEMBER"]),
    })
    .strict();

export type ServerAuthorizationResponse = z.infer<
    typeof ServerAuthorizationResponseSchema
>;

export type BackendClientResponse =
    | {
          healthy: true;
          status: number;
          content: string;
      }
    | {
          healthy: false;
          reason: string;
          status?: number;
      };
//We will initialize this instance in the main entry point
export class BackendClient {
    private readonly baseUrl: string;
    private readonly timeoutMs: number;
    private readonly gatewayServiceToken: string;
    constructor(
        baseUrl: string,
        gatewayServiceToken: string,
        timeoutMs: number = DEFAULT_TIMEOUT,
    ) {
        this.baseUrl = baseUrl.replace(/\/+$/, "");
        this.timeoutMs = timeoutMs;
        this.gatewayServiceToken = gatewayServiceToken;
    }
    checkInternalHealth(): Promise<BackendClientResponse> {
        return this.get("/internal/realtime/health", {
            //Gui them mot truong X-Gateway-Token de nhan biet xem day co dung that su la request tu gateway cua he thong hay khong
            "X-Gateway-Token": this.gatewayServiceToken,
        });
    }
    checkHealth(): Promise<BackendClientResponse> {
        return this.get("/health");
    }

    async validateSession(
        accessToken: string,
    ): Promise<SessionValidationResponse> {
        let response: Response;

        try {
            response = await fetch(
                `${this.baseUrl}/internal/realtime/session/validate`,
                {
                    method: "POST",
                    headers: {
                        accept: "application/json",
                        Authorization: `Bearer ${accessToken}`,
                        //Backend se uu tien authorization header.
                        //Khong nen chuyen doi qua cookie, vi luc nay, tinh chat httpOnly cua cookie da khong con loi ich gi. Dong thoi, dung Bearer de test va de quan sat hon

                        "X-Gateway-Token": this.gatewayServiceToken,
                    },
                    signal: AbortSignal.timeout(this.timeoutMs),
                },
            );
        } catch {
            throw new BackendError("unreachable");
        }

        if (!response.ok) {
            throw new BackendError("http-error", response.status);
        }

        let body: unknown;

        try {
            body = await response.json();
        } catch {
            throw new BackendError("invalid-response", response.status);
        }

        const parsed = SessionValidationResponseSchema.safeParse(body);

        if (!parsed.success) {
            throw new BackendError("invalid-response", response.status);
        }

        return parsed.data;
    }

    //Update the backend client with a function to calling API
    private async get(
        path: string,
        headers: Record<string, string> = {},
    ): Promise<BackendClientResponse> {
        try {
            const response = await fetch(`${this.baseUrl}${path}`, {
                headers: {
                    accept: "application/json, text/plain",
                    ...headers,
                },
                signal: AbortSignal.timeout(this.timeoutMs),
            });
            const content = await response.text(); //Convert to the text
            if (!response.ok)
                return {
                    healthy: false,
                    reason: "http-error",
                    status: response.status,
                };
            return {
                healthy: true,
                status: response.status,
                content,
            };
        } catch (err) {
            return {
                healthy: false,
                reason: "unreachable",
            };
        }
    }
    async authorizeServer(
        accessToken: string,
        serverId: string,
    ): Promise<ServerAuthorizationResponse> {
        let response: Response;

        try {
            response = await fetch(
                `${this.baseUrl}/internal/realtime/servers/${serverId}/authorize`,
                {
                    method: "POST",
                    headers: {
                        accept: "application/json",
                        Authorization: `Bearer ${accessToken}`,
                        "X-Gateway-Token": this.gatewayServiceToken,
                    },
                    signal: AbortSignal.timeout(this.timeoutMs),
                },
            );
        } catch {
            throw new BackendError("unreachable");
        }

        if (!response.ok) {
            throw new BackendError("http-error", response.status);
        }

        let body: unknown;

        try {
            body = await response.json();
        } catch {
            throw new BackendError("invalid-response", response.status);
        }

        const parsed = ServerAuthorizationResponseSchema.safeParse(body);

        if (!parsed.success) {
            throw new BackendError("invalid-response", response.status);
        }

        return parsed.data;
    }

    async createChatMessage(
        accessToken: string,
        serverId: string,
        command: Pick<
            ChatSendCommand,
            "clientRequestId" | "contentText" | "replyToMessageId"
        >,
    ): Promise<ChatMessageDto> {
        let response: Response;

        try {
            response = await fetch(
                `${this.baseUrl}/internal/realtime/servers/${serverId}/messages`,
                {
                    method: "POST",
                    headers: {
                        accept: "application/json",
                        "content-type": "application/json",
                        Authorization: `Bearer ${accessToken}`,
                        "X-Gateway-Token": this.gatewayServiceToken,
                    },
                    body: JSON.stringify(command),
                    signal: AbortSignal.timeout(this.timeoutMs),
                },
            );
        } catch {
            throw new BackendError("unreachable");
        }

        if (!response.ok) {
            throw new BackendError("http-error", response.status);
        }

        let body: unknown;

        try {
            body = await response.json();
        } catch {
            throw new BackendError("invalid-response", response.status);
        }

        //Gateway chi tin DTO sau khi da validate response cua Spring
        const parsed = ChatMessageDtoSchema.safeParse(body);

        if (!parsed.success) {
            throw new BackendError("invalid-response", response.status);
        }

        return parsed.data;
    }
}
