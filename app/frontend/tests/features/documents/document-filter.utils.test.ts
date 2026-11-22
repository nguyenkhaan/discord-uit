import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { TaxonomyCollection } from '@/features/taxonomy/taxonomy.type';
import {
    createEmptyDocumentFilter,
    filterDocumentCollections,
    type DocumentFilterValue,
} from '@/features/documents/document-filter.utils';

const collections: TaxonomyCollection[] = [
    {
        id: 'ai',
        name: 'AI Research',
        slug: 'ai-research',
        description: 'Nghiên cứu trí tuệ nhân tạo.',
        keywords: ['machine learning'],
        documentCount: 3,
        classificationCount: 0,
        tagSlugs: ['research', 'ai'],
        updatedAt: '',
    },
    {
        id: 'cloud',
        name: 'Cloud Engineering',
        slug: 'cloud-engineering',
        description: 'Hạ tầng và vận hành cloud.',
        keywords: ['devops'],
        documentCount: 2,
        classificationCount: 0,
        tagSlugs: ['cloud'],
        updatedAt: '',
    },
    {
        id: 'product',
        name: 'Product Design',
        slug: 'product-design',
        description: 'Thiết kế sản phẩm số.',
        keywords: ['ux'],
        documentCount: 1,
        classificationCount: 0,
        tagSlugs: ['ux'],
        updatedAt: '',
    },
];

describe('document filter utilities', () => {
    it('returns every collection when all filters are empty', () => {
        assert.deepEqual(
            filterDocumentCollections(collections, createEmptyDocumentFilter()),
            collections
        );
    });

    it('searches collection name, slug, description and keywords', () => {
        const filters: DocumentFilterValue = {
            ...createEmptyDocumentFilter(),
            search: 'devops',
        };

        assert.deepEqual(
            filterDocumentCollections(collections, filters).map(
                (item) => item.id
            ),
            ['cloud']
        );
    });

    it('matches any selected collection and any selected tag within each group', () => {
        const filters: DocumentFilterValue = {
            ...createEmptyDocumentFilter(),
            collectionSlugs: ['ai-research', 'product-design'],
            tagSlugs: ['ux', 'research'],
        };

        assert.deepEqual(
            filterDocumentCollections(collections, filters).map(
                (item) => item.id
            ),
            ['ai', 'product']
        );
    });

    it('combines search, collection and tag filters with AND semantics', () => {
        const filters: DocumentFilterValue = {
            search: 'cloud',
            collectionSlugs: ['cloud-engineering', 'ai-research'],
            tagSlugs: ['cloud', 'research'],
        };

        assert.deepEqual(
            filterDocumentCollections(collections, filters).map(
                (item) => item.id
            ),
            ['cloud']
        );
    });

    it('creates a clear filter state', () => {
        assert.deepEqual(createEmptyDocumentFilter(), {
            search: '',
            collectionSlugs: [],
            tagSlugs: [],
        });
    });
});
