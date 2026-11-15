export const chatKeys = {
    all: ['chat'] as const,
    history: (serverId: string) =>
        [...chatKeys.all, 'history', serverId] as const,
    reactions: (serverId: string, messageId: string) =>
        [...chatKeys.all, 'reactions', serverId, messageId] as const,
};
