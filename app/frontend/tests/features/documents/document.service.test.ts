import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import { privateClient } from '@/api/client';
import {
    updateAdminDocumentTaxonomy,
    validateDocumentFile,
} from '@/features/documents/document.service';

const originalPrivatePatch = privateClient.patch;

afterEach(() => {
    privateClient.patch = originalPrivatePatch;
});

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

describe('document taxonomy service', () => {
    it('patches both taxonomy lists and maps the response', async () => {
        const calls: unknown[][] = [];
        privateClient.patch = (async (...arguments_: unknown[]) => {
            calls.push(arguments_);
            return {
                data: {
                    documentId: 'document-id',
                    collectionSlugs: ['ai-research', 'software-engineering'],
                    tagSlugs: ['machine-learning', 'research'],
                },
            };
        }) as typeof privateClient.patch;

        const response = await updateAdminDocumentTaxonomy('document-id', {
            collectionSlugs: ['ai-research', 'software-engineering'],
            tagSlugs: ['machine-learning', 'research'],
        });

        assert.deepEqual(response, {
            documentId: 'document-id',
            collectionSlugs: ['ai-research', 'software-engineering'],
            tagSlugs: ['machine-learning', 'research'],
        });
        assert.deepEqual(calls, [
            [
                '/admin/documents/document-id/taxonomy',
                {
                    collectionSlugs: ['ai-research', 'software-engineering'],
                    tagSlugs: ['machine-learning', 'research'],
                },
            ],
        ]);
    });
});
