import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { TaxonomyCollection } from '@/features/taxonomy/taxonomy.type';
import {
    paginateDocumentCollections,
    sortDocumentCollections,
} from '@/features/documents/documents-catalog.utils';

const collections: TaxonomyCollection[] = [
    {
        id: 'old',
        name: 'Zebra Research',
        slug: 'zebra-research',
        description: '',
        keywords: [],
        documentCount: 2,
        classificationCount: 0,
        tagSlugs: [],
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: 'new',
        name: 'AI Research',
        slug: 'ai-research',
        description: '',
        keywords: [],
        documentCount: 5,
        classificationCount: 0,
        tagSlugs: [],
        updatedAt: '2025-01-01T00:00:00Z',
    },
    {
        id: 'invalid-date',
        name: 'Cloud Engineering',
        slug: 'cloud-engineering',
        description: '',
        keywords: [],
        documentCount: 3,
        classificationCount: 0,
        tagSlugs: [],
        updatedAt: '',
    },
];

describe('documents catalog utilities', () => {
    it('sorts collections by newest, name, and document count without mutating input', () => {
        assert.deepEqual(
            sortDocumentCollections(collections, 'newest').map(
                (item) => item.id
            ),
            ['new', 'old', 'invalid-date']
        );
        assert.deepEqual(
            sortDocumentCollections(collections, 'name').map((item) => item.id),
            ['new', 'invalid-date', 'old']
        );
        assert.deepEqual(
            sortDocumentCollections(collections, 'documents').map(
                (item) => item.id
            ),
            ['new', 'invalid-date', 'old']
        );
        assert.deepEqual(
            collections.map((item) => item.id),
            ['old', 'new', 'invalid-date']
        );
    });

    it('paginates with one-based clamped pages and supports empty input', () => {
        const result = paginateDocumentCollections(collections, 9, 2);

        assert.deepEqual(result, {
            items: [collections[2]],
            page: 2,
            pageCount: 2,
            total: 3,
        });
        assert.deepEqual(paginateDocumentCollections([], 2, 2), {
            items: [],
            page: 1,
            pageCount: 1,
            total: 0,
        });
    });
});
