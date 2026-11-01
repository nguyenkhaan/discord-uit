import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    createServer,
    getServer,
    getServerMembers,
    getServers,
} from './server.service';

export const serverKeys = {
    all: ['servers'] as const,
    listMine: () => [...serverKeys.all, 'listMine'] as const,
    detail: (serverId: string) => [...serverKeys.all, serverId] as const,
    members: (serverId: string) =>
        [...serverKeys.detail(serverId), 'members'] as const,
};

export function useGetServers() {
    return useQuery({
        queryKey: serverKeys.listMine(),
        queryFn: getServers,
    });
}

export function useGetServer(serverId: string) {
    return useQuery({
        enabled: Boolean(serverId),
        queryKey: serverKeys.detail(serverId),
        queryFn: () => getServer(serverId),
    });
}

export function useGetServerMembers(serverId: string) {
    return useQuery({
        enabled: Boolean(serverId),
        queryKey: serverKeys.members(serverId),
        queryFn: () => getServerMembers(serverId),
    });
}

export function useCreateServerMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createServer,
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: serverKeys.all }),
    });
}
