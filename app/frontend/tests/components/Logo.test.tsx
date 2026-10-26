import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { Logo } from '@/components/Logo';

describe('Logo', () => {
    it('links to the home route and renders responsive branding', () => {
        const markup = renderToStaticMarkup(
            <MemoryRouter>
                <Logo />
            </MemoryRouter>
        );

        assert.match(markup, /href="\/"/);
        assert.match(markup, /alt="UIT Connect"/);
        assert.match(markup, /class="h-8 w-auto object-contain/);
        assert.match(markup, /sm:h-8/);
        assert.match(markup, /md:h-10/);
        assert.match(markup, /lg:h-14/);
    });
});
