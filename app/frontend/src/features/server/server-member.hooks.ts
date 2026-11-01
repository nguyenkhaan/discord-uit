import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { serverKeys } from '@/features/server/server.keys';
import {
    kickServerMember,
    leaveServer,
    listServerMembers,
    promoteServerMember,
} from '@/features/server/server-member.service';
import type { ServerMemberTarget } from '@/features/server/server.type';

export function useServerMembers(serverId: string) {
    return useQuery({
        enabled: serverId !== '',
        queryKey: serverKeys.members(serverId),
        queryFn: () => listServerMembers(serverId),
    });
}

export function usePromoteServerMemberMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: promoteServerMember,
        onSuccess: (_data, { serverId }: ServerMemberTarget) =>
            queryClient.invalidateQueries({ queryKey: serverKeys.members(serverId) }),
    });
}

export function useKickServerMemberMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: kickServerMember,
        // Số thành viên hiển thị trong danh sách cũng thay đổi
        onSuccess: (_data, { serverId }: ServerMemberTarget) =>
            Promise.all([
                queryClient.invalidateQueries({ queryKey: serverKeys.detail(serverId) }),
                queryClient.invalidateQueries({ queryKey: serverKeys.lists() }),
            ]),
    });
}

export function useLeaveServerMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: leaveServer,
        onSuccess: (_data, serverId: string) => {
            queryClient.removeQueries({ queryKey: serverKeys.detail(serverId) });
            return Promise.all([
                queryClient.invalidateQueries({ queryKey: serverKeys.lists() }),
                queryClient.invalidateQueries({ queryKey: serverKeys.statusCounts() }),
            ]);
        },
    });
}
