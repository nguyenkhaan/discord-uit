import type { ReactNode } from 'react';

import { Button } from '@/components/common/Button';

interface ForumListStatesProps {
    isLoading: boolean;
    isError: boolean;
    isEmpty: boolean;
    emptyMessage: ReactNode;
    onRetry: () => void;
    hasMore: boolean;
    isLoadingMore: boolean;
    onLoadMore: () => void;
    children: ReactNode;
}

/** Khung danh sách bài: đang tải, lỗi, trống và nút tải thêm */
export function ForumListStates({
    isLoading,
    isError,
    isEmpty,
    emptyMessage,
    onRetry,
    hasMore,
    isLoadingMore,
    onLoadMore,
    children,
}: ForumListStatesProps) {
    if (isLoading) {
        return (
            <div aria-busy="true" className="space-y-3">
                {[0, 1, 2].map((key) => (
                    <div
                        className="h-32 animate-pulse rounded-xl bg-surface-subtle"
                        key={key}
                    />
                ))}
            </div>
        );
    }

    if (isError) {
        return (
            <div
                className="flex items-center justify-between gap-3 rounded-xl bg-danger-subtle px-4 py-3 text-sm text-feedback-danger"
                role="alert"
            >
                <span>Không tải được danh sách bài viết.</span>
                <Button onClick={onRetry} size="compact" variant="ghost">
                    Thử lại
                </Button>
            </div>
        );
    }

    if (isEmpty) {
        return (
            <div className="rounded-xl border border-dashed border-line bg-surface px-6 py-12 text-center text-body-sm text-muted">
                {emptyMessage}
            </div>
        );
    }

    return (
        <>
            <div className="space-y-3">{children}</div>
            {hasMore && (
                <div className="mt-4 flex justify-center">
                    <Button
                        disabled={isLoadingMore}
                        onClick={onLoadMore}
                        size="compact"
                        variant="secondary"
                    >
                        {isLoadingMore ? 'Đang tải...' : 'Xem thêm'}
                    </Button>
                </div>
            )}
        </>
    );
}
