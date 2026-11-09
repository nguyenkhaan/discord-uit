import { useState } from 'react';

/** Quản lý các dòng đang được chọn trong bảng admin (giữ lựa chọn khi chuyển trang) */
export function useRowSelection(pageIds: string[]) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(
        () => new Set()
    );

    const isAllPageSelected =
        pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
    const isSomePageSelected =
        !isAllPageSelected && pageIds.some((id) => selectedIds.has(id));

    function toggle(id: string) {
        setSelectedIds((previous) => {
            const next = new Set(previous);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    function togglePage() {
        setSelectedIds((previous) => {
            const next = new Set(previous);
            pageIds.forEach((id) =>
                isAllPageSelected ? next.delete(id) : next.add(id)
            );
            return next;
        });
    }

    function clear() {
        setSelectedIds(new Set());
    }

    return {
        selectedIds,
        isAllPageSelected,
        isSomePageSelected,
        toggle,
        togglePage,
        clear,
    };
}
