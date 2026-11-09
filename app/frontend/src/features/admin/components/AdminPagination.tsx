import { ChevronLeft, ChevronRight } from 'lucide-react';

import { formatAdminNumber, getPageItems } from '@/features/admin/admin.utils';
import { cn } from '@/lib/utils';

interface AdminPaginationProps {
    page: number;
    totalPages: number;
    start: number;
    end: number;
    totalItems: number;
    /** Danh từ hiển thị, ví dụ: "báo cáo", "người dùng" */
    itemLabel: string;
    onPageChange: (page: number) => void;
}

const PAGE_BUTTON_CLASS =
    'grid size-9 cursor-pointer place-items-center rounded-lg border border-line bg-surface text-sm text-foreground-secondary transition-colors hover:border-line-brand-hover hover:text-brand focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50';

export function AdminPagination({
    page,
    totalPages,
    start,
    end,
    totalItems,
    itemLabel,
    onPageChange,
}: AdminPaginationProps) {
    const summary =
        totalItems === 0
            ? `Không có ${itemLabel}`
            : `Hiển thị ${start + 1} - ${end} của ${formatAdminNumber(totalItems)} ${itemLabel}`;

    return (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-line-subtle px-4 py-4 sm:flex-row">
            <p aria-live="polite" className="text-sm text-muted">
                {summary}
            </p>
            <nav
                aria-label="Phân trang"
                className="flex flex-wrap items-center gap-1.5"
            >
                <button
                    aria-label="Trang trước"
                    className={PAGE_BUTTON_CLASS}
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                    type="button"
                >
                    <ChevronLeft aria-hidden="true" className="size-4" />
                </button>
                {getPageItems(page, totalPages).map((item, index) =>
                    item === 'ellipsis' ? (
                        <span
                            aria-hidden="true"
                            className="w-6 text-center text-sm text-muted"
                            key={`gap-${index}`}
                        >
                            …
                        </span>
                    ) : (
                        <button
                            aria-current={item === page ? 'page' : undefined}
                            aria-label={`Trang ${item}`}
                            className={cn(
                                PAGE_BUTTON_CLASS,
                                'w-auto min-w-9 px-2',
                                item === page &&
                                    'border-brand bg-brand text-on-brand hover:border-brand hover:text-on-brand'
                            )}
                            key={item}
                            onClick={() => onPageChange(item)}
                            type="button"
                        >
                            {formatAdminNumber(item)}
                        </button>
                    )
                )}
                <button
                    aria-label="Trang sau"
                    className={PAGE_BUTTON_CLASS}
                    disabled={page >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                    type="button"
                >
                    <ChevronRight aria-hidden="true" className="size-4" />
                </button>
            </nav>
        </div>
    );
}
