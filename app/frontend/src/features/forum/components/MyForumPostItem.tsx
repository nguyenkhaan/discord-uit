import { Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';

import { buttonVariants } from '@/components/common/buttonVariants';
import { ForumDeletePostButton } from '@/features/forum/components/ForumDeletePostButton';
import { ForumPostStatusBadge } from '@/features/forum/components/ForumPostStatusBadge';
import { ForumTopicTags } from '@/features/forum/components/ForumTopicTags';
import type { MyForumPost } from '@/features/forum/forum.type';
import { formatForumTime } from '@/features/forum/forum.utils';

interface MyForumPostItemProps {
    post: MyForumPost;
}

/** Một bài của tôi: trạng thái, lý do từ chối/gỡ, sửa và xoá */
export function MyForumPostItem({ post }: MyForumPostItemProps) {
    const status = post.status ?? 'PENDING_REVIEW';
    const canEdit = status !== 'REMOVED';
    const hasReason =
        (status === 'REJECTED' || status === 'REMOVED') &&
        post.moderationReason;

    return (
        <article className="rounded-xl border border-line-subtle bg-surface p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
                <ForumPostStatusBadge status={status} />
                {post.anonymous && (
                    <span className="text-caption text-muted">
                        Đăng ẩn danh
                    </span>
                )}
                <span className="ml-auto text-caption text-muted">
                    Cập nhật {formatForumTime(post.updatedAt)}
                </span>
            </div>
            <h2 className="mt-2 text-lg font-bold text-heading">
                <Link
                    className="hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                    to={`/forum/${post.id}`}
                >
                    {post.title}
                </Link>
            </h2>
            {post.excerpt && (
                <p className="mt-1 line-clamp-2 text-body-sm text-muted">
                    {post.excerpt}
                </p>
            )}
            {hasReason && (
                <p className="mt-2 rounded-lg bg-danger-subtle px-3 py-2 text-body-sm text-feedback-danger">
                    Lý do: {post.moderationReason}
                </p>
            )}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <ForumTopicTags topics={post.topics} />
                <div className="ml-auto flex gap-1">
                    {canEdit && post.id && (
                        <Link
                            className={buttonVariants({
                                size: 'compact',
                                variant: 'ghost',
                            })}
                            to={`/forum/${post.id}/edit`}
                        >
                            <Pencil aria-hidden="true" className="size-4" />
                            {status === 'REJECTED' ? 'Sửa và gửi lại' : 'Sửa'}
                        </Link>
                    )}
                    {post.id && (
                        <ForumDeletePostButton
                            postId={post.id}
                            title={post.title}
                        />
                    )}
                </div>
            </div>
        </article>
    );
}
