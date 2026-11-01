import type { ServerStatusFilter } from '@/features/server/server.type';

/** Query keys dùng chung cho mọi hook của feature server (user, member, admin) */
export const serverKeys = {
    all: ['servers'] as const,
    lists: () => [...serverKeys.all, 'list'] as const,
    list: (filter: ServerStatusFilter = {}) => [...serverKeys.lists(), filter] as const,
    statusCounts: (filter: ServerStatusFilter = {}) =>
        [...serverKeys.all, 'status-counts', filter] as const,
    details: () => [...serverKeys.all, 'detail'] as const,
    detail: (serverId: string) => [...serverKeys.details(), serverId] as const,
    members: (serverId: string) => [...serverKeys.detail(serverId), 'members'] as const,
};
