import { Search, X } from 'lucide-react';
import type { ReactNode } from 'react';

import { Input } from '@/components/common/Input';

interface AdminTableToolbarProps {
    searchValue: string;
    searchLabel: string;
    searchPlaceholder: string;
    onSearchChange: (value: string) => void;
    /** Các AdminFilterSelect */
    filters: ReactNode;
    /** Nút thao tác chính bên phải: Xuất danh sách, Thêm server... */
    action: ReactNode;
}

export function AdminTableToolbar({
    searchValue,
    searchLabel,
    searchPlaceholder,
    onSearchChange,
    filters,
    action,
}: AdminTableToolbarProps) {
    return (
        <div className="flex flex-col gap-4 border-b border-line-subtle p-4 xl:flex-row xl:items-end">
            <div className="w-full xl:max-w-md xl:flex-1">
                <Input
                    aria-label={searchLabel}
                    className="h-11"
                    endAdornment={
                        searchValue && (
                            <button
                                aria-label="Xóa từ khóa"
                                className="grid size-9 cursor-pointer place-items-center rounded-md text-muted transition-colors hover:bg-surface-subtle hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                                onClick={() => onSearchChange('')}
                                type="button"
                            >
                                <X aria-hidden="true" className="size-4" />
                            </button>
                        )
                    }
                    onChange={(event) => onSearchChange(event.target.value)}
                    placeholder={searchPlaceholder}
                    size="compact"
                    startIcon={<Search className="size-4" />}
                    type="search"
                    value={searchValue}
                />
            </div>
            <div className="flex flex-1 flex-wrap items-end gap-3">
                {filters}
                <div className="w-full sm:ml-auto sm:w-auto">{action}</div>
            </div>
        </div>
    );
}
