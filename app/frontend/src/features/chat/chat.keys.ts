export const chatKeys = {
    all: ['chat'] as const,
    history: (serverId: string) =>
        [...chatKeys.all, 'history', serverId] as const,
};
