import type { ServerResponse, ServerStatus } from '@/features/server/server.type';

/** Thứ tự hiển thị; `satisfies` bắt lỗi nếu backend đổi enum ServerStatus */
export const SERVER_STATUSES = ['ACTIVE', 'LOCKED', 'CLOSED'] as const satisfies readonly ServerStatus[];

export const DEFAULT_SERVER_STATUS: ServerStatus = 'ACTIVE';

interface ServerStatusMeta {
    label: string;
    badgeClass: string;
    dotClass: string;
}

export const SERVER_STATUS_META: Record<ServerStatus, ServerStatusMeta> = {
    ACTIVE: {
        label: 'Đang hoạt động',
        badgeClass: 'text-emerald-700 bg-emerald-50 ring-emerald-600/20',
        dotClass: 'bg-emerald-500',
    },
    LOCKED: {
        label: 'Đã khóa',
        badgeClass: 'text-rose-700 bg-rose-50 ring-rose-600/20',
        dotClass: 'bg-rose-500',
    },
    CLOSED: {
        label: 'Đã đóng',
        badgeClass: 'text-gray-600 bg-gray-100 ring-gray-500/20',
        dotClass: 'bg-gray-400',
    },
};

export function isServerStatus(value: unknown): value is ServerStatus {
    return typeof value === 'string' && (SERVER_STATUSES as readonly string[]).includes(value);
}

export function getServerStatus(server: ServerResponse): ServerStatus {
    return isServerStatus(server.status) ? server.status : DEFAULT_SERVER_STATUS;
}
