import { SearchX, type LucideIcon } from 'lucide-react';

import { Button } from '@/components/common/Button';

interface AdminEmptyRowProps {
    colSpan: number;
    isFiltering: boolean;
    emptyIcon: LucideIcon;
    emptyTitle: string;
}

export function AdminEmptyRow({
    colSpan,
    isFiltering,
    emptyIcon: EmptyIcon,
    emptyTitle,
}: AdminEmptyRowProps) {
    const Icon = isFiltering ? SearchX : EmptyIcon;

    return (
        <tr>
            <td className="px-4 py-14" colSpan={colSpan}>
                <div className="flex flex-col items-center text-center">
                    <Icon
                        aria-hidden="true"
                        className="mb-3 size-10 text-placeholder"
                    />
                    <p className="font-medium text-foreground">
                        {isFiltering
                            ? 'Không tìm thấy kết quả phù hợp'
                            : emptyTitle}
                    </p>
                    {isFiltering && (
                        <p className="mt-1 text-sm text-muted">
                            Hãy thử từ khóa hoặc bộ lọc khác.
                        </p>
                    )}
                </div>
            </td>
        </tr>
    );
}

interface AdminSelectionBarProps {
    count: number;
    itemLabel: string;
    onClear: () => void;
}

export function AdminSelectionBar({
    count,
    itemLabel,
    onClear,
}: AdminSelectionBarProps) {
    if (count === 0) return null;

    return (
        <div
            aria-live="polite"
            className="flex items-center justify-between border-b border-line-brand bg-brand-subtle px-4 py-2 text-sm text-brand"
        >
            <span>
                Đã chọn {count} {itemLabel}
            </span>
            <Button
                className="min-h-8 px-2 text-sm font-medium"
                onClick={onClear}
                size="compact"
                variant="ghost"
            >
                Bỏ chọn
            </Button>
        </div>
    );
}
