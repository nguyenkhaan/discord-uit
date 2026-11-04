import { expect, test } from "bun:test";
import {
    ChatMessageDtoSchema,
    ChatSendCommandSchema,
    ServerJoinCommandSchema,
    ServerLeaveCommandSchema,
} from "../../src/contracts/realtime";

const VALID_SERVER_ID = "0f8fad5b-d9cb-469f-a165-70867728950e";
const VALID_REQUEST_ID = "7c9e6679-7425-40de-944b-e07fc1f90ae7";

test("rejects server-join with a non-UUID serverId", () => {
    const result = ServerJoinCommandSchema.safeParse({
        serverId: "general-room",
    });

    expect(result.success).toBe(false);
});

test("rejects server-leave with a raw room name", () => {
    const result = ServerLeaveCommandSchema.safeParse({
        serverId: `server:${VALID_SERVER_ID}`,
    });

    expect(result.success).toBe(false);
});

test("rejects chat content that is blank after trimming", () => {
    const result = ChatSendCommandSchema.safeParse({
        serverId: VALID_SERVER_ID,
        clientRequestId: VALID_REQUEST_ID,
        contentText: "   ",
    });

    expect(result.success).toBe(false);
});

test("rejects chat content longer than 2,000 characters", () => {
    const result = ChatSendCommandSchema.safeParse({
        serverId: VALID_SERVER_ID,
        clientRequestId: VALID_REQUEST_ID,
        contentText: "a".repeat(2_001),
    });

    expect(result.success).toBe(false);
});

test("accepts chat content containing exactly 2,000 characters", () => {
    const result = ChatSendCommandSchema.safeParse({
        serverId: VALID_SERVER_ID,
        clientRequestId: VALID_REQUEST_ID,
        contentText: "a".repeat(2_000),
    });

    expect(result.success).toBe(true);
});

test("returns trimmed chat content from successful parsing", () => {
    const result = ChatSendCommandSchema.parse({
        serverId: VALID_SERVER_ID,
        clientRequestId: VALID_REQUEST_ID,
        contentText: "  hello realtime  ",
    });

    expect(result.contentText).toBe("hello realtime");
});

test("rejects a chat message DTO with a non-ISO createdAt", () => {
    const result = ChatMessageDtoSchema.safeParse({
        messageId: "6ba7b810-9dad-41d1-80b4-00c04fd430c8",
        serverId: VALID_SERVER_ID,
        senderUserId: "16fd2706-8baf-433b-82eb-8c7fada847da",
        clientRequestId: VALID_REQUEST_ID,
        contentText: "hello realtime",
        createdAt: "04/11/2026 10:30",
    });

    expect(result.success).toBe(false);
});
