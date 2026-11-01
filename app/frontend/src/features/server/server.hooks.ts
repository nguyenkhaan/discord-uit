import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { serverKeys } from '@/features/server/server.keys';
import {
    countMyServersByStatus,
    createServer,
    getServer,
    listMyServers,
    updateServerStatus,
} from '@/features/server/server.service';
import { isServerStatus } from '@/features/server/server.status';
import type {
    ServerResponse,
    ServerStatusCountResponse,
    ServerStatusCounts,
    ServerStatusFilter,
} from '@/features/server/server.type';

/** Chuẩn hóa mảng `[{ status, serverCount }]` thành `{ ACTIVE, LOCKED, CLOSED }` */
function toStatusCounts(rows: ServerStatusCountResponse[]): ServerStatusCounts {
    const counts: ServerStatusCounts = { ACTIVE: 0, LOCKED: 0, CLOSED: 0 };
    rows.forEach(({ status, serverCount }) => {
        if (isServerStatus(status)) counts[status] = serverCount ?? 0;
    });
    return counts;
}

/** Danh sách server của người dùng, có thể lọc theo trạng thái ở phía backend */
export function useServerList(filter: ServerStatusFilter = {}) {
    return useQuery({
        queryKey: serverKeys.list(filter),
        queryFn: () => listMyServers(filter),
        // Giữ dữ liệu cũ khi đổi bộ lọc để bảng không bị nháy
        placeholderData: keepPreviousData,
    });
}

/** Số lượng server theo từng trạng thái (ACTIVE / LOCKED / CLOSED) */
export function useServerStatusCounts(filter: ServerStatusFilter = {}) {
    return useQuery({
        queryKey: serverKeys.statusCounts(filter),
        queryFn: () => countMyServersByStatus(filter),
        select: toStatusCounts,
    });
}

export function useServer(serverId: string) {
    return useQuery({
        enabled: serverId !== '',
        queryKey: serverKeys.detail(serverId),
        queryFn: () => getServer(serverId),
    });
}

export function useCreateServerMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createServer,
        // Server mới ảnh hưởng tới cả danh sách lẫn số liệu thống kê
        onSuccess: () => queryClient.invalidateQueries({ queryKey: serverKeys.all }),
    });
}

/** Đổi trạng thái server (chỉ OWNER) */
export function useUpdateServerStatusMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateServerStatus,
        onSuccess: (server: ServerResponse) => {
            if (server.id) queryClient.setQueryData(serverKeys.detail(server.id), server);
            return Promise.all([
                queryClient.invalidateQueries({ queryKey: serverKeys.lists() }),
                queryClient.invalidateQueries({ queryKey: serverKeys.statusCounts() }),
            ]);
        },
    });
}
