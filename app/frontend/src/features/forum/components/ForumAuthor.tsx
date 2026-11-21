import { VenetianMask } from 'lucide-react';

import { UserAvatar } from '@/components/common/UserAvatar';
import { formatForumTime } from '@/features/forum/forum.utils';

interface ForumAuthorProps {
    name: string | undefined;
    anonymous: boolean | undefined;
    createdAt: string | undefined;
}

/** Tác giả và thời gian đăng; bài ẩn danh hiện biểu tượng mặt nạ */
export function ForumAuthor({ name, anonymous, createdAt }: ForumAuthorProps) {
    const displayName = name || 'Thành viên';

    return (
        <p className="flex min-w-0 items-center gap-2 text-sm text-muted">
            {anonymous ? (
                <span
                    aria-hidden="true"
                    className="grid size-8 shrink-0 place-items-center rounded-full bg-heading text-on-brand"
                >
                    <VenetianMask className="size-4" />
                </span>
            ) : (
                <UserAvatar name={displayName} size="sm" />
            )}
            <span className="truncate font-semibold text-foreground-secondary">
                {displayName}
            </span>
            {createdAt && (
                <>
                    <span aria-hidden="true">·</span>
                    <time className="shrink-0" dateTime={createdAt}>
                        {formatForumTime(createdAt)}
                    </time>
                </>
            )}
        </p>
    );
}
