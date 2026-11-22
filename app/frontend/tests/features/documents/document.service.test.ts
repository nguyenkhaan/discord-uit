import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { validateDocumentFile } from '@/features/documents/document.service';

describe('document upload validation', () => {
    it('accepts supported files within the storage limit', () => {
        const file = new File(['%PDF-1.7'], 'notes.pdf', {
            type: 'application/pdf',
        });

        assert.equal(validateDocumentFile(file), null);
    });

    it('rejects unsupported extensions and oversized files', () => {
        const unsupported = new File(['binary'], 'notes.exe', {
            type: 'application/octet-stream',
        });
        const oversized = new File(
            [new Uint8Array(5 * 1024 * 1024 + 1)],
            'notes.pdf',
            {
                type: 'application/pdf',
            }
        );

        assert.match(validateDocumentFile(unsupported) ?? '', /PDF/);
        assert.match(validateDocumentFile(oversized) ?? '', /5 MB/);
    });
});
