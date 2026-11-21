import type { ForumPostStatus } from '@/features/forum/forum.type';

interface ForumPostStatusMeta {
    label: string;
    badgeClass: string;
    /** Giải thích cho tác giả */
    hint: string;
}

export const FORUM_POST_STATUS_META: Record<
    ForumPostStatus,
    ForumPostStatusMeta
> = {
    PENDING_REVIEW: {
        label: 'Chờ duyệt',
        badgeClass: 'bg-amber-50 text-amber-700 ring-amber-600/20',
        hint: 'Bài đang chờ quản trị viên duyệt, chỉ bạn xem được.',
    },
    APPROVED: {
        label: 'Đã duyệt',
        badgeClass: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
        hint: 'Bài đã hiển thị công khai trên diễn đàn.',
    },
    REJECTED: {
        label: 'Bị từ chối',
        badgeClass: 'bg-rose-50 text-rose-700 ring-rose-600/20',
        hint: 'Bài không được duyệt. Bạn có thể sửa và gửi duyệt lại.',
    },
    REMOVED: {
        label: 'Đã gỡ',
        badgeClass: 'bg-gray-100 text-gray-600 ring-gray-500/20',
        hint: 'Bài đã bị quản trị viên gỡ và không thể sửa.',
    },
};
