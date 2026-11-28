import type { AdminTone } from '@/features/admin/admin.type';
import type { ClassificationRunStatus } from '@/features/documents/document.type';

export function getClassificationStatusLabel(
    status: ClassificationRunStatus | null
): string {
    switch (status) {
        case 'QUEUED':
            return 'Đang chờ xử lý';
        case 'RUNNING':
            return 'Đang phân loại';
        case 'SUCCEEDED':
            return 'Đã hoàn tất';
        case 'FAILED':
            return 'Xử lý thất bại';
        case 'DEAD_LETTER':
            return 'Đã dừng sau lỗi';
        default:
            return 'Chưa bắt đầu';
    }
}

export function getClassificationStatusTone(
    status: ClassificationRunStatus | null
): AdminTone {
    if (status === 'SUCCEEDED') return 'success';
    if (status === 'FAILED' || status === 'DEAD_LETTER') return 'danger';
    return 'warning';
}
