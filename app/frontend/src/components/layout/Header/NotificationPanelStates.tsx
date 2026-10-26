import { Inbox, RefreshCw } from 'lucide-react';

import { Button } from '@/components/common/Button';

export function NotificationLoadingState() {
    return (
        <div
            aria-label="Đang tải thông báo"
            className="space-y-2 p-2.5"
            role="status"
        >
            {[0, 1, 2].map((item) => (
                <div
                    className="animate-pulse rounded-lg border border-line-subtle bg-surface px-3 py-2.5"
                    key={item}
                >
                    <div className="flex gap-2.5">
                        <div className="size-8 rounded-md bg-surface-subtle" />
                        <div className="flex-1 space-y-2">
                            <div className="h-3 w-2/5 rounded bg-surface-subtle" />
                            <div className="h-3 w-full rounded bg-surface-subtle" />
                            <div className="h-3 w-3/4 rounded bg-surface-subtle" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function NotificationErrorState({ onRetry }: { onRetry: () => void }) {
    return (
        <div
            className="grid place-items-center px-5 py-8 text-center"
            role="alert"
        >
            <RefreshCw className="size-8 text-muted" />
            <p className="mt-3 font-semibold text-heading">
                Không thể tải thông báo
            </p>
            <p className="mt-1 text-body-sm text-muted">
                Kiểm tra kết nối rồi thử lại.
            </p>
            <Button
                className="mt-4"
                onClick={onRetry}
                size="compact"
                variant="secondary"
            >
                Thử lại
            </Button>
        </div>
    );
}

export function NotificationEmptyState() {
    return (
        <div
            className="grid place-items-center px-5 py-8 text-center"
            role="status"
        >
            <span className="grid size-10 place-items-center rounded-lg border border-line-subtle bg-surface text-muted">
                <Inbox className="size-5" strokeWidth={1.6} />
            </span>
            <p className="mt-3 font-semibold text-heading">Chưa có thông báo</p>
            <p className="mt-1 max-w-60 text-body-sm text-muted">
                Cập nhật về máy chủ, tài liệu và diễn đàn sẽ xuất hiện tại đây.
            </p>
        </div>
    );
}
