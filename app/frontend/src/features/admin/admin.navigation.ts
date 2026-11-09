import type { LucideIcon } from 'lucide-react';
import {
    Bell,
    FileText,
    Flag,
    House,
    MessageSquareMore,
    Server,
    Settings,
    Users,
} from 'lucide-react';

export interface AdminNavigationItem {
    icon: LucideIcon;
    label: string;
    to: string;
    /** true: chỉ active khi khớp chính xác đường dẫn */
    end?: boolean;
    badgeKey?: 'pendingReports';
}

export const ADMIN_BASE_PATH = '/admin';

export const adminNavigationItems: AdminNavigationItem[] = [
    { icon: House, label: 'Tổng quan', to: ADMIN_BASE_PATH, end: true },
    {
        icon: Users,
        label: 'Quản lý người dùng',
        to: `${ADMIN_BASE_PATH}/accounts`,
    },
    { icon: Server, label: 'Quản lý server', to: `${ADMIN_BASE_PATH}/servers` },
    {
        icon: FileText,
        label: 'Quản lý tài liệu',
        to: `${ADMIN_BASE_PATH}/documents`,
    },
    {
        icon: MessageSquareMore,
        label: 'Quản lý diễn đàn',
        to: `${ADMIN_BASE_PATH}/forum`,
    },
    {
        icon: Flag,
        label: 'Báo cáo vi phạm',
        to: `${ADMIN_BASE_PATH}/reports`,
        badgeKey: 'pendingReports',
    },
    { icon: Bell, label: 'Thông báo', to: `${ADMIN_BASE_PATH}/notifications` },
    { icon: Settings, label: 'Cài đặt', to: `${ADMIN_BASE_PATH}/settings` },
];
