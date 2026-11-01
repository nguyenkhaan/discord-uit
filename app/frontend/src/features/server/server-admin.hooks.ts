import { useMutation, useQueryClient } from '@tanstack/react-query';

import { serverKeys } from '@/features/server/server.keys';
import { adminDeleteServer, adminKickServerMember } from '@/features/server/server-admin.service';
import type { AdminDeleteServerPayload, ServerMemberTarget } from '@/features/server/server.type';

/** Hook dành riêng cho ADMIN thao tác với server */

export function useAdminDeleteServerMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: adminDeleteServer,
        onSuccess: (_data, { serverId }: AdminDeleteServerPayload) => {
            queryClient.removeQueries({ queryKey: serverKeys.detail(serverId) });
            return Promise.all([
                queryClient.invalidateQueries({ queryKey: serverKeys.lists() }),
                queryClient.invalidateQueries({ queryKey: serverKeys.statusCounts() }),
            ]);
        },
    });
}

export function useAdminKickServerMemberMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: adminKickServerMember,
        onSuccess: (_data, { serverId }: ServerMemberTarget) =>
            Promise.all([
                queryClient.invalidateQueries({ queryKey: serverKeys.members(serverId) }),
                queryClient.invalidateQueries({ queryKey: serverKeys.detail(serverId) }),
                queryClient.invalidateQueries({ queryKey: serverKeys.lists() }),
            ]),
    });
}
