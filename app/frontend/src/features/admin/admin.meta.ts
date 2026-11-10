import type { LucideIcon } from 'lucide-react';
import {
    BookOpen,
    FileText,
    Gamepad2,
    Image,
    Languages,
    LineChart,
    MessageCircle,
    Newspaper,
    Palette,
    Server,
    Users,
    Music,
} from 'lucide-react';

import type {
    AdminServerCategory,
    AdminServerStatus,
    AdminTone,
    AdminUserRole,
    AdminUserStatus,
    ReportStatus,
    ReportTargetType,
    ViolationType,
} from '@/features/admin/admin.type';

export interface AdminLabelMeta {
    label: string;
    tone: AdminTone;
}

export const REPORT_TARGET_META: Record<
    ReportTargetType,
    { label: string; icon: LucideIcon; tone: AdminTone }
> = {
    DOCUMENT: { label: 'Tài liệu', icon: FileText, tone: 'danger' },
    POST: { label: 'Bài viết', icon: Newspaper, tone: 'info' },
    COMMENT: { label: 'Bình luận', icon: MessageCircle, tone: 'neutral' },
    IMAGE: { label: 'Hình ảnh', icon: Image, tone: 'neutral' },
    SERVER: { label: 'Server', icon: Server, tone: 'info' },
};

export const VIOLATION_TYPE_META: Record<ViolationType, AdminLabelMeta> = {
    COPYRIGHT: { label: 'Vi phạm bản quyền', tone: 'danger' },
    SPAM: { label: 'Spam', tone: 'danger' },
    OFFENSIVE_LANGUAGE: { label: 'Ngôn từ không phù hợp', tone: 'warning' },
    ADVERTISING: { label: 'Quảng cáo', tone: 'warning' },
    INAPPROPRIATE: { label: 'Nội dung không phù hợp', tone: 'warning' },
    MALWARE: { label: 'Chứa mã độc', tone: 'danger' },
    DUPLICATE: { label: 'Trùng lặp nội dung', tone: 'info' },
};

export const REPORT_STATUS_META: Record<ReportStatus, AdminLabelMeta> = {
    PENDING: { label: 'Đang xử lý', tone: 'warning' },
    RESOLVED: { label: 'Đã xử lý', tone: 'success' },
    DISMISSED: { label: 'Đã bỏ qua', tone: 'neutral' },
};

export const USER_ROLE_META: Record<AdminUserRole, AdminLabelMeta> = {
    STUDENT: { label: 'Sinh viên', tone: 'info' },
    LECTURER: { label: 'Giảng viên', tone: 'success' },
    ADMIN: { label: 'Quản trị viên', tone: 'violet' },
};

export const USER_STATUS_META: Record<AdminUserStatus, AdminLabelMeta> = {
    ACTIVE: { label: 'Hoạt động', tone: 'success' },
    WARNED: { label: 'Bị cảnh cáo', tone: 'warning' },
    BANNED: { label: 'Bị khóa', tone: 'danger' },
};

export const SERVER_CATEGORY_META: Record<AdminServerCategory, AdminLabelMeta> =
    {
        EDUCATION: { label: 'Học tập', tone: 'info' },
        CREATIVE: { label: 'Sáng tạo', tone: 'violet' },
        LANGUAGE: { label: 'Ngoại ngữ', tone: 'danger' },
        ENTERTAINMENT: { label: 'Giải trí', tone: 'warning' },
        LIFESTYLE: { label: 'Đời sống', tone: 'success' },
        BUSINESS: { label: 'Kinh doanh', tone: 'info' },
        HOBBY: { label: 'Sở thích', tone: 'violet' },
    };

export const SERVER_CATEGORY_ICON: Record<AdminServerCategory, LucideIcon> = {
    EDUCATION: BookOpen,
    CREATIVE: Palette,
    LANGUAGE: Languages,
    ENTERTAINMENT: Gamepad2,
    LIFESTYLE: Users,
    BUSINESS: LineChart,
    HOBBY: Music,
};

export const SERVER_STATUS_META: Record<AdminServerStatus, AdminLabelMeta> = {
    ACTIVE: { label: 'Hoạt động', tone: 'success' },
    SUSPENDED: { label: 'Tạm ngừng', tone: 'warning' },
    LOCKED: { label: 'Bị khóa', tone: 'danger' },
};
