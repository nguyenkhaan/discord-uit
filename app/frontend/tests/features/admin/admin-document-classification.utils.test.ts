import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    getClassificationStatusLabel,
    getClassificationStatusTone,
} from '@/features/admin/admin-document-classification.utils';
import type { ClassificationRunStatus } from '@/features/documents/document.type';

describe('admin document classification status mapping', () => {
    it('maps each run status to a Vietnamese label and semantic tone', () => {
        assert.deepEqual(
            ([
                ['QUEUED', 'Đang chờ xử lý', 'warning'],
                ['RUNNING', 'Đang phân loại', 'warning'],
                ['SUCCEEDED', 'Đã hoàn tất', 'success'],
                ['FAILED', 'Xử lý thất bại', 'danger'],
                ['DEAD_LETTER', 'Đã dừng sau lỗi', 'danger'],
            ] as const satisfies readonly [ClassificationRunStatus, string, string][]).map(
                ([status]) => [
                    getClassificationStatusLabel(status),
                    getClassificationStatusTone(status),
                ]
            ),
            [
                ['Đang chờ xử lý', 'warning'],
                ['Đang phân loại', 'warning'],
                ['Đã hoàn tất', 'success'],
                ['Xử lý thất bại', 'danger'],
                ['Đã dừng sau lỗi', 'danger'],
            ]
        );
    });

    it('treats a missing run as not started with a warning tone', () => {
        assert.equal(getClassificationStatusLabel(null), 'Chưa bắt đầu');
        assert.equal(getClassificationStatusTone(null), 'warning');
    });
});
