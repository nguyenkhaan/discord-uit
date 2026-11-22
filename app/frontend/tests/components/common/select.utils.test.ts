import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    filterSelectOptions,
    getMultiSelectSummary,
    toggleSelectValue,
} from '@/components/common/select.utils';
import type { SelectOption } from '@/components/common/select.types';

const options: SelectOption[] = [
    {
        value: 'ai-research',
        label: 'AI Research',
        description: '3 tài liệu',
    },
    {
        value: 'cloud-engineering',
        label: 'Cloud Engineering',
        description: 'DevOps và hạ tầng',
    },
    {
        value: 'product-design',
        label: 'Product Design',
        description: 'UX research',
        disabled: true,
    },
];

describe('select utilities', () => {
    it('filters options by label, value, and description', () => {
        assert.deepEqual(
            filterSelectOptions(options, '  devops ').map(
                (option) => option.value
            ),
            ['cloud-engineering']
        );
        assert.deepEqual(
            filterSelectOptions(options, 'ai-research').map(
                (option) => option.value
            ),
            ['ai-research']
        );
    });

    it('returns no options when the search has no matches', () => {
        assert.deepEqual(filterSelectOptions(options, 'not-found'), []);
    });

    it('toggles values without mutating the input and ignores disabled options', () => {
        const selected = ['ai-research'];

        assert.deepEqual(toggleSelectValue(selected, 'cloud-engineering'), [
            'ai-research',
            'cloud-engineering',
        ]);
        assert.deepEqual(toggleSelectValue(selected, 'ai-research'), []);
        assert.deepEqual(toggleSelectValue(selected, 'product-design', true), [
            'ai-research',
        ]);
        assert.deepEqual(selected, ['ai-research']);
    });

    it('summarizes zero, one, and many selected options', () => {
        assert.equal(
            getMultiSelectSummary([], 'Tất cả collections'),
            'Tất cả collections'
        );
        assert.equal(
            getMultiSelectSummary([options[0]], 'Tất cả'),
            'AI Research'
        );
        assert.equal(
            getMultiSelectSummary(options.slice(0, 2), 'Tất cả'),
            'AI Research +1'
        );
    });
});
