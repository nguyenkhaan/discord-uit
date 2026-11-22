import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { hasTaxonomySelectionChanged } from '@/features/admin/admin-document-taxonomy.utils';

describe('admin document taxonomy utilities', () => {
    it('treats taxonomy lists as equal regardless of order', () => {
        assert.equal(
            hasTaxonomySelectionChanged(
                {
                    collectionSlugs: ['ai-research', 'engineering'],
                    tagSlugs: ['ml', 'research'],
                },
                {
                    collectionSlugs: ['engineering', 'ai-research'],
                    tagSlugs: ['research', 'ml'],
                }
            ),
            false
        );
    });

    it('detects changed collection or tag selections', () => {
        assert.equal(
            hasTaxonomySelectionChanged(
                {
                    collectionSlugs: ['ai-research'],
                    tagSlugs: ['research'],
                },
                {
                    collectionSlugs: ['ai-research'],
                    tagSlugs: ['ml'],
                }
            ),
            true
        );
    });
});
