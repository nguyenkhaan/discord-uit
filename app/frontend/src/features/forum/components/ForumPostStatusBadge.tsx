import { FORUM_POST_STATUS_META } from '@/features/forum/forum.status';
import type { ForumPostStatus } from '@/features/forum/forum.type';
import { cn } from '@/lib/utils';

interface ForumPostStatusBadgeProps {
    status: ForumPostStatus;
    className?: string;
}

export function ForumPostStatusBadge({
    status,
    className,
}: ForumPostStatusBadgeProps) {
    const meta = FORUM_POST_STATUS_META[status];
    return (
        <span
            className={cn(
                'inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
                meta.badgeClass,
                className
            )}
        >
            {meta.label}
        </span>
    );
}
