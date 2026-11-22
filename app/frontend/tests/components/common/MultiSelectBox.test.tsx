import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { renderToStaticMarkup } from 'react-dom/server';

import { MultiSelectBox } from '@/components/common/MultiSelectBox';
import type { SelectOption } from '@/components/common/select.types';

const options: SelectOption[] = [
    { value: 'ai-research', label: 'AI Research' },
    { value: 'cloud-engineering', label: 'Cloud Engineering' },
];

describe('MultiSelectBox', () => {
    it('renders an accessible trigger with a concise multiple-selection summary', () => {
        const markup = renderToStaticMarkup(
            <MultiSelectBox
                id="tag-select"
                label="Tags"
                onChange={() => undefined}
                options={options}
                value={['ai-research', 'cloud-engineering']}
            />
        );

        assert.match(markup, /Tags/);
        assert.match(markup, /AI Research \+1/);
        assert.match(markup, /aria-haspopup="listbox"/);
        assert.match(markup, /aria-expanded="false"/);
        assert.match(markup, /aria-labelledby="tag-select-label"/);
    });

    it('renders the placeholder when no option is selected', () => {
        const markup = renderToStaticMarkup(
            <MultiSelectBox
                aria-label="Tags"
                onChange={() => undefined}
                options={options}
                placeholder="Tất cả tags"
                value={[]}
            />
        );

        assert.match(markup, /Tất cả tags/);
    });
});
