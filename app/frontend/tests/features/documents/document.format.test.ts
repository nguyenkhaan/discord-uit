import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { formatFileSize } from '@/features/documents/document.format';

describe('formatFileSize', () => {
    it('keeps byte values in bytes', () => {
        assert.equal(formatFileSize(0), '0 B');
        assert.equal(formatFileSize(1023), '1023 B');
    });

    it('uses kilobytes for small documents', () => {
        assert.equal(formatFileSize(1024), '1.0 KB');
        assert.equal(formatFileSize(32768), '32.0 KB');
        assert.equal(formatFileSize(1048575), '1024.0 KB');
    });

    it('uses megabytes and gigabytes after their thresholds', () => {
        assert.equal(formatFileSize(1048576), '1.0 MB');
        assert.equal(formatFileSize(1073741824), '1.0 GB');
    });
});
