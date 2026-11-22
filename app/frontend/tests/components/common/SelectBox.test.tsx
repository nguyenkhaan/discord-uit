import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { renderToStaticMarkup } from 'react-dom/server';

import { SelectBox } from '@/components/common/SelectBox';
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
        disabled: true,
    },
];

describe('SelectBox', () => {
    it('renders an accessible single-select trigger and selected label', () => {
        const markup = renderToStaticMarkup(
            <SelectBox
                id="collection-select"
                label="Collection"
                onChange={() => undefined}
                options={options}
                value="ai-research"
            />
        );

        assert.match(markup, /Collection/);
        assert.match(markup, /AI Research/);
        assert.match(markup, /aria-haspopup="listbox"/);
        assert.match(markup, /aria-expanded="false"/);
        assert.match(markup, /aria-controls="collection-select-menu"/);
    });

    it('renders the placeholder and disabled trigger state', () => {
        const markup = renderToStaticMarkup(
            <SelectBox
                aria-label="Collection"
                disabled
                onChange={() => undefined}
                options={options}
                placeholder="Tất cả collections"
                value={null}
            />
        );

        assert.match(markup, /Tất cả collections/);
        assert.match(markup, /disabled=""/);
    });
});
