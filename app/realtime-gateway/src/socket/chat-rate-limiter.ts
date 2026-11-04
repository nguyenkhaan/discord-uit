//Rate limit theo userId (khong theo socket.id) de nguoi dung khong the mo nhieu connection nham vuot gioi han
export class ChatRateLimiter {
    private readonly timestampsByUser = new Map<string, number[]>();

    constructor(
        private readonly maxMessages: number,
        private readonly windowMs: number,
    ) {}

    tryConsume(userId: string, now = Date.now()): boolean {
        const windowStart = now - this.windowMs;
        const timestamps =
            this.timestampsByUser
                .get(userId)
                ?.filter((timestamp) => timestamp > windowStart) ?? [];

        if (timestamps.length >= this.maxMessages) {
            this.timestampsByUser.set(userId, timestamps);
            return false;
        }

        timestamps.push(now);
        this.timestampsByUser.set(userId, timestamps);
        return true;
    }
}
