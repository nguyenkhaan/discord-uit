const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
});

export function formatAdminDate(value: string): string {
    return dateFormatter.format(new Date(value));
}

export function formatAdminTime(value: string): string {
    return timeFormatter.format(new Date(value));
}

export function formatAdminNumber(value: number): string {
    return value.toLocaleString('en-US');
}

export function toTimestamp(value: string): number {
    return new Date(value).getTime();
}

export type PageItem = number | 'ellipsis';

/** Danh sách số trang rút gọn theo thiết kế: 1 2 3 4 5 … 43 */
export function getPageItems(current: number, total: number): PageItem[] {
    if (total <= 7)
        return Array.from({ length: total }, (_, index) => index + 1);

    if (current <= 4) return [1, 2, 3, 4, 5, 'ellipsis', total];
    if (current >= total - 3) {
        return [
            1,
            'ellipsis',
            total - 4,
            total - 3,
            total - 2,
            total - 1,
            total,
        ];
    }
    return [
        1,
        'ellipsis',
        current - 1,
        current,
        current + 1,
        'ellipsis',
        total,
    ];
}

export interface PageSlice<T> {
    items: T[];
    page: number;
    totalPages: number;
    start: number;
    end: number;
}

/** Cắt dữ liệu theo trang; tự kẹp số trang khi bộ lọc làm giảm số kết quả */
export function paginate<T>(
    rows: T[],
    currentPage: number,
    pageSize: number
): PageSlice<T> {
    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
    const page = Math.min(Math.max(currentPage, 1), totalPages);
    const start = (page - 1) * pageSize;
    const end = Math.min(start + pageSize, rows.length);

    return { items: rows.slice(start, end), page, totalPages, start, end };
}

function escapeCsvCell(value: string | number): string {
    const text = String(value);
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/** Xuất CSV có BOM để Excel đọc đúng tiếng Việt */
export function downloadCsv(
    fileName: string,
    header: string[],
    rows: Array<Array<string | number>>
): void {
    const content = [header, ...rows]
        .map((row) => row.map(escapeCsvCell).join(','))
        .join('\n');
    const blob = new Blob(['﻿', content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
}
