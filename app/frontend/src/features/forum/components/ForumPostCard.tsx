import { Link } from 'react-router-dom';

import { ForumAuthor } from '@/features/forum/components/ForumAuthor';
import { ForumTopicTags } from '@/features/forum/components/ForumTopicTags';
import type { ForumPostSummary } from '@/features/forum/forum.type';

interface ForumPostCardProps {
    post: ForumPostSummary;
}

/** Một bài trong danh sách công khai */
export function ForumPostCard({ post }: ForumPostCardProps) {
    return (
        <article className="relative rounded-xl border border-line-subtle bg-surface p-4 transition-colors focus-within:ring-2 focus-within:ring-focus hover:border-line-brand sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
                <h2 className="min-w-0 text-lg font-bold text-heading">
                    {/* Cả thẻ bấm được nhờ after:absolute */}
                    <Link
                        className="outline-none after:absolute after:inset-0 hover:text-brand"
                        to={`/forum/${post.id}`}
                    >
                        {post.title}
                    </Link>
                </h2>
                {post.mine && (
                    <span className="rounded-md bg-brand-subtle px-2 py-0.5 text-xs font-medium text-brand">
                        Của bạn
                    </span>
                )}
            </div>
            {post.excerpt && (
                <p className="mt-1.5 line-clamp-2 text-body-sm text-muted">
                    {post.excerpt}
                </p>
            )}
            <div className="relative mt-3 flex flex-wrap items-center justify-between gap-3">
                <ForumAuthor
                    anonymous={post.anonymous}
                    createdAt={post.createdAt}
                    name={post.authorName}
                />
                <ForumTopicTags isLinkable topics={post.topics} />
            </div>
        </article>
    );
}
