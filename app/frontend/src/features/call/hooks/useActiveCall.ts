import { useQuery } from '@tanstack/react-query';

import { getActiveCall } from '@/features/call/call.service';

export const activeCallKey = (serverId: string) =>
    ['calls', 'active', serverId] as const;

/**
 * Polls the server's active call so the pre-join screen shows who is
 * already inside, and the call screen knows who the coordinator is.
 */
export function useActiveCall(serverId: string, refetchIntervalMs = 5000) {
    return useQuery({
        queryKey: activeCallKey(serverId),
        queryFn: () => getActiveCall(serverId),
        enabled: Boolean(serverId),
        refetchInterval: refetchIntervalMs,
        refetchOnWindowFocus: true,
    });
}
