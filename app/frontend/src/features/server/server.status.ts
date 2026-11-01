import type { ServerResponse } from './server.service';

/** Các trạng thái của server (khớp với enum ServerStatus phía backend) */
export const SERVER_STATUSES = ['ACTIVE', 'LOCKED', 'CLOSED'] as const;

export type ServerStatus = (typeof SERVER_STATUSES)[number];

export const DEFAULT_SERVER_STATUS: ServerStatus = 'ACTIVE';

interface ServerStatusMeta {
    label: string;
    /** Màu chữ + nền của badge trong bảng */
    badgeClass: string;
    /** Màu chấm tròn trong badge */
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

/**
 * Lấy trạng thái của server.
 * `ServerResponse` hiện chưa có trường `status` (backend chưa trả về),
 * nên đọc an toàn và mặc định là ACTIVE.
 */
export function getServerStatus(server: ServerResponse): ServerStatus {
    const status: unknown = 'status' in server ? server.status : undefined;
    return isServerStatus(status) ? status : DEFAULT_SERVER_STATUS;
}
