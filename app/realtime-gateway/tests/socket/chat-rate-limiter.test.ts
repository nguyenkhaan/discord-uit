import { expect, test } from "bun:test";
import { ChatRateLimiter } from "../../src/socket/chat-rate-limiter";

test("rejects messages beyond the configured limit within one window", () => {
    const limiter = new ChatRateLimiter(2, 10_000);

    expect(limiter.tryConsume("user-1", 1_000)).toBe(true);
    expect(limiter.tryConsume("user-1", 2_000)).toBe(true);
    expect(limiter.tryConsume("user-1", 3_000)).toBe(false);
});

test("allows another message after the previous window expires", () => {
    const limiter = new ChatRateLimiter(1, 10_000);

    expect(limiter.tryConsume("user-1", 1_000)).toBe(true);
    expect(limiter.tryConsume("user-1", 10_999)).toBe(false);
    expect(limiter.tryConsume("user-1", 11_000)).toBe(true);
});

test("tracks rate limits independently for each user", () => {
    const limiter = new ChatRateLimiter(1, 10_000);

    expect(limiter.tryConsume("user-1", 1_000)).toBe(true);
    expect(limiter.tryConsume("user-2", 1_000)).toBe(true);
});
