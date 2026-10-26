import { Check, Mail, Trash2 } from 'lucide-react';

import { Button } from '@/components/common/Button';
import type {
    NotificationKind,
    NotificationResponse,
} from '@/features/notification/notification.type';
import { cn } from '@/lib/utils';

interface NotificationCardProps {
    notification: NotificationResponse;
    isDeleting: boolean;
    isMarkingAsRead: boolean;
    onDelete: (notificationId: string) => void;
    onMarkAsRead: (notificationId: string) => void;
}

const NOTIFICATION_TITLES: Record<NotificationKind, string> = {
    SERVER_INVITATION: 'Lời mời máy chủ',
    ADMIN_MESSAGE: 'Thông báo từ quản trị viên',
    DOCUMENT_REJECTED: 'Tài liệu bị từ chối',
    DOCUMENT_REPORTED: 'Tài liệu bị báo cáo',
    FORUM_POST_APPROVED: 'Bài viết được duyệt',
};

const DEFAULT_NOTIFICATION_TITLE = 'Thông báo';

const notificationDateFormatter = new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
});

function formatNotificationDate(createdAt?: string): string {
    if (!createdAt) {
        return 'Không rõ thời gian';
    }

    const date = new Date(createdAt);
    return Number.isNaN(date.getTime())
        ? 'Không rõ thời gian'
        : notificationDateFormatter.format(date);
}

export function NotificationCard({
    notification,
    isDeleting,
    isMarkingAsRead,
    onDelete,
    onMarkAsRead,
}: NotificationCardProps) {
    const isUnread = !notification.readAt;
    const title = notification.kind
        ? NOTIFICATION_TITLES[notification.kind]
        : DEFAULT_NOTIFICATION_TITLE;
    const notificationId = notification.id;
    const content =
        notification.content?.trim() || 'Thông báo không có nội dung.';

    return (
        <article
            className={cn(
                'relative overflow-hidden rounded-lg border bg-surface px-3 py-2.5 transition-colors',
                isUnread
                    ? 'border-line-brand bg-brand-subtle/40'
                    : 'border-line-subtle hover:border-line'
            )}
        >
            {isUnread && (
                <span
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 w-1 bg-brand"
                />
            )}

            <div className="flex items-start gap-2.5">
                <span
                    aria-hidden="true"
                    className={cn(
                        'mt-0.5 grid size-8 shrink-0 place-items-center rounded-md border',
                        isUnread
                            ? 'border-line-brand bg-surface text-brand'
                            : 'border-line-subtle bg-surface-subtle text-muted'
                    )}
                >
                    <Mail className="size-4" strokeWidth={1.8} />
                </span>

                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-heading">
                        {title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-body-sm leading-snug text-foreground-secondary">
                        {content}
                    </p>
                    <time
                        className="mt-1 block text-caption text-muted"
                        dateTime={notification.createdAt}
                    >
                        {formatNotificationDate(notification.createdAt)}
                    </time>
                </div>

                {notificationId && (
                    <div className="flex shrink-0 items-center gap-0.5 self-center">
                        {isUnread && (
                            <Button
                                aria-label="Đánh dấu thông báo đã đọc"
                                className="size-8 min-h-8 text-brand"
                                disabled={isMarkingAsRead}
                                onClick={() => onMarkAsRead(notificationId)}
                                size="icon"
                                title="Đánh dấu đã đọc"
                                variant="ghost"
                            >
                                <Check className="size-4" />
                            </Button>
                        )}
                        <Button
                            aria-label="Xóa thông báo"
                            className="size-8 min-h-8 text-muted hover:bg-danger-subtle hover:text-feedback-danger"
                            disabled={isDeleting}
                            onClick={() => onDelete(notificationId)}
                            size="icon"
                            title="Xóa thông báo"
                            variant="ghost"
                        >
                            <Trash2 className="size-4" />
                        </Button>
                    </div>
                )}
            </div>
        </article>
    );
}
