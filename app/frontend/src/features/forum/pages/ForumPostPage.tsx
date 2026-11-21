import { ArrowLeft, Pencil } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { buttonVariants } from '@/components/common/buttonVariants';
import { ForumAuthor } from '@/features/forum/components/ForumAuthor';
import { ForumContentView } from '@/features/forum/components/ForumContentView';
import { ForumDeletePostButton } from '@/features/forum/components/ForumDeletePostButton';
import { ForumPageMessage } from '@/features/forum/components/ForumPageMessage';
import { ForumPostStatusBadge } from '@/features/forum/components/ForumPostStatusBadge';
import { ForumTopicTags } from '@/features/forum/components/ForumTopicTags';
import { useForumPost } from '@/features/forum/forum.hooks';
import { FORUM_POST_STATUS_META } from '@/features/forum/forum.status';
import { getApiErrorStatus } from '@/lib/api-error';

/** U09 — Đọc bài viết (bình luận làm ở 6.2) */
export default function ForumPostPage() {
    const { postId = '' } = useParams<{ postId: string }>();
    const navigate = useNavigate();
    const { data: post, isPending, isError, error } = useForumPost(postId);

    if (isPending) {
        return (
            <div
                aria-busy="true"
                className="mx-auto h-96 w-full max-w-3xl animate-pulse px-4 py-6"
            />
        );
    }

    if (isError || !post) {
        const isMissing = getApiErrorStatus(error) === 404;
        return (
            <ForumPageMessage
                description={
                    isMissing
                        ? 'Bài viết đã bị xoá, chưa được duyệt hoặc không tồn tại.'
                        : 'Đã có lỗi khi tải bài viết. Vui lòng thử lại.'
                }
                title={
                    isMissing
                        ? 'Không tìm thấy bài viết'
                        : 'Không tải được bài viết'
                }
            />
        );
    }

    // Chỉ tác giả nhận được status
    const status = post.mine ? post.status : undefined;
    const showReason =
        (status === 'REJECTED' || status === 'REMOVED') &&
        post.moderationReason;

    return (
        <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
            <Link
                className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-brand"
                to="/forum"
            >
                <ArrowLeft aria-hidden="true" className="size-4" />
                Diễn đàn
            </Link>

            {status && status !== 'APPROVED' && (
                <div
                    className="mb-4 rounded-xl border border-line bg-surface-subtle px-4 py-3"
                    role="status"
                >
                    <p className="flex flex-wrap items-center gap-2 text-body-sm text-foreground-secondary">
                        <ForumPostStatusBadge status={status} />
                        {FORUM_POST_STATUS_META[status].hint}
                    </p>
                    {showReason && (
                        <p className="mt-2 text-body-sm text-feedback-danger">
                            Lý do: {post.moderationReason}
                        </p>
                    )}
                </div>
            )}

            <article className="rounded-xl border border-line-subtle bg-surface p-5 sm:p-7">
                <h1 className="break-words text-2xl font-bold text-heading sm:text-[28px]">
                    {post.title}
                </h1>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <ForumAuthor
                        anonymous={post.anonymous}
                        createdAt={post.createdAt}
                        name={post.authorName}
                    />
                    {post.mine && post.id && (
                        <div className="flex gap-1">
                            {status !== 'REMOVED' && (
                                <Link
                                    className={buttonVariants({
                                        size: 'compact',
                                        variant: 'ghost',
                                    })}
                                    to={`/forum/${post.id}/edit`}
                                >
                                    <Pencil
                                        aria-hidden="true"
                                        className="size-4"
                                    />
                                    Sửa
                                </Link>
                            )}
                            <ForumDeletePostButton
                                onDeleted={() =>
                                    navigate('/forum?tab=mine', {
                                        replace: true,
                                    })
                                }
                                postId={post.id}
                                title={post.title}
                            />
                        </div>
                    )}
                </div>
                <div className="mt-3">
                    <ForumTopicTags
                        isLinkable={
                            status === undefined || status === 'APPROVED'
                        }
                        topics={post.topics}
                    />
                </div>
                <div className="mt-5 border-t border-line-subtle pt-4">
                    <ForumContentView content={post.content} />
                </div>
            </article>
        </div>
    );
}
