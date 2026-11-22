import { PenSquare, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { buttonVariants } from '@/components/common/buttonVariants';
import { Input } from '@/components/common/Input';
import { Tabs } from '@/components/common/Tabs';
import { ForumListStates } from '@/features/forum/components/ForumListStates';
import { ForumPostCard } from '@/features/forum/components/ForumPostCard';
import { ForumTopicInput } from '@/features/forum/components/ForumTopicInput';
import { MyForumPostItem } from '@/features/forum/components/MyForumPostItem';
import { useForumFeed, useMyForumPosts } from '@/features/forum/forum.hooks';
import type { ForumPostFilter } from '@/features/forum/forum.type';
import { normalizeForumTopic } from '@/features/forum/forum.utils';

type ForumTab = 'latest' | 'mine';

const SEARCH_DELAY_MS = 300;

/** U08 — Diễn đàn: bài đã duyệt và bài của tôi */
export default function ForumFeedPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const tab: ForumTab =
        searchParams.get('tab') === 'mine' ? 'mine' : 'latest';
    const q = searchParams.get('q') ?? '';
    const topicParams = searchParams.getAll('topic');
    const topicsKey = topicParams.join('\n');
    const topics = useMemo(
        () =>
            topicsKey
                .split('\n')
                .map(normalizeForumTopic)
                .filter((topic): topic is string => topic !== null),
        [topicsKey]
    );
    const filter = useMemo<ForumPostFilter>(() => ({ q, topics }), [q, topics]);

    // Gõ xong mới tìm, tránh gọi API mỗi phím
    const [keyword, setKeyword] = useState(q);
    useEffect(() => {
        const next = keyword.trim();
        if (next === q) return;
        const timer = setTimeout(() => {
            setSearchParams(
                (current) => {
                    const params = new URLSearchParams(current);
                    if (next) params.set('q', next);
                    else params.delete('q');
                    return params;
                },
                { replace: true }
            );
        }, SEARCH_DELAY_MS);
        return () => clearTimeout(timer);
    }, [keyword, q, setSearchParams]);

    function updateParams(next: { tab?: ForumTab; topics?: string[] }) {
        setSearchParams(
            (current) => {
                const params = new URLSearchParams(current);
                if (next.tab !== undefined) {
                    if (next.tab === 'mine') params.set('tab', 'mine');
                    else params.delete('tab');
                }
                if (next.topics !== undefined) {
                    params.delete('topic');
                    next.topics.forEach((topic) =>
                        params.append('topic', topic)
                    );
                }
                return params;
            },
            { replace: true }
        );
    }

    const feed = useForumFeed(filter);
    const mine = useMyForumPosts(tab === 'mine');
    const feedPosts =
        feed.data?.pages.flatMap((page) => page.items ?? []) ?? [];
    const myPosts = mine.data?.pages.flatMap((page) => page.items ?? []) ?? [];
    const isFiltering = q !== '' || topics.length > 0;

    return (
        <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
            <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-heading sm:text-[28px]">
                        Diễn đàn
                    </h1>
                    <p className="mt-1 text-body-sm text-muted">
                        Trao đổi, thảo luận và chia sẻ kinh nghiệm cùng cộng
                        đồng UIT. Bạn có thể đăng bài ẩn danh.
                    </p>
                </div>
                <Link
                    className={buttonVariants({ size: 'compact' })}
                    to="/forum/new"
                >
                    <PenSquare aria-hidden="true" className="size-4" />
                    Viết bài mới
                </Link>
            </header>

            <Tabs
                items={[
                    {
                        value: 'latest',
                        label: 'Bài viết mới nhất',
                        content: (
                            <div className="space-y-4 pt-4">
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <label
                                            className="mb-1.5 block text-sm font-semibold text-heading"
                                            htmlFor="forum-search"
                                        >
                                            Tìm theo tiêu đề
                                        </label>
                                        <Input
                                            endAdornment={
                                                keyword ? (
                                                    <button
                                                        aria-label="Xoá từ khoá"
                                                        className="grid size-9 cursor-pointer place-items-center rounded-md text-muted hover:text-brand"
                                                        onClick={() =>
                                                            setKeyword('')
                                                        }
                                                        type="button"
                                                    >
                                                        <X
                                                            aria-hidden="true"
                                                            className="size-4"
                                                        />
                                                    </button>
                                                ) : undefined
                                            }
                                            id="forum-search"
                                            maxLength={100}
                                            onChange={(event) =>
                                                setKeyword(event.target.value)
                                            }
                                            placeholder="Nhập từ khoá..."
                                            size="compact"
                                            startIcon={
                                                <Search className="size-4" />
                                            }
                                            type="search"
                                            value={keyword}
                                        />
                                    </div>
                                    <ForumTopicInput
                                        hint="Hiện bài có ít nhất một chủ đề đã chọn"
                                        label="Lọc theo chủ đề"
                                        onChange={(next) =>
                                            updateParams({ topics: next })
                                        }
                                        topics={topics}
                                    />
                                </div>

                                <ForumListStates
                                    emptyMessage={
                                        isFiltering
                                            ? 'Không có bài viết nào khớp bộ lọc.'
                                            : 'Chưa có bài viết nào. Hãy là người đầu tiên đăng bài!'
                                    }
                                    hasMore={feed.hasNextPage}
                                    isEmpty={feedPosts.length === 0}
                                    isError={feed.isError}
                                    isLoading={feed.isPending}
                                    isLoadingMore={feed.isFetchingNextPage}
                                    onLoadMore={() => void feed.fetchNextPage()}
                                    onRetry={() => void feed.refetch()}
                                >
                                    {feedPosts.map((post) => (
                                        <ForumPostCard
                                            key={post.id}
                                            post={post}
                                        />
                                    ))}
                                </ForumListStates>
                            </div>
                        ),
                    },
                    {
                        value: 'mine',
                        label: 'Bài viết của bạn',
                        content: (
                            <div className="pt-4">
                                <ForumListStates
                                    emptyMessage="Bạn chưa đăng bài nào."
                                    hasMore={mine.hasNextPage}
                                    isEmpty={myPosts.length === 0}
                                    isError={mine.isError}
                                    isLoading={mine.isPending}
                                    isLoadingMore={mine.isFetchingNextPage}
                                    onLoadMore={() => void mine.fetchNextPage()}
                                    onRetry={() => void mine.refetch()}
                                >
                                    {myPosts.map((post) => (
                                        <MyForumPostItem
                                            key={post.id}
                                            post={post}
                                        />
                                    ))}
                                </ForumListStates>
                            </div>
                        ),
                    },
                ]}
                label="Danh sách bài viết"
                onValueChange={(value) => updateParams({ tab: value })}
                value={tab}
            />
        </div>
    );
}
