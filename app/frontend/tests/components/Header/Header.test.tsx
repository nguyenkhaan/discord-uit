import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { Header } from '@/components/Header/Header';

function renderHeader(withMenu = true) {
    const queryClient = new QueryClient();

    return renderToStaticMarkup(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>
                <Header onMenuClick={withMenu ? () => undefined : undefined} />
            </MemoryRouter>
        </QueryClientProvider>
    );
}

describe('Header', () => {
    it('reuses shared controls and renders search plus the temporary user identity', () => {
        const markup = renderHeader();

        assert.match(markup, /aria-label="Mở menu"/);
        assert.match(
            markup,
            /<button(?=[^>]*aria-controls="app-sidebar")(?=[^>]*aria-expanded="false")[^>]*>/
        );
        assert.match(markup, /alt="UIT Connect"/);
        assert.match(markup, /type="search"/);
        assert.match(markup, /placeholder="Tìm server của bạn\.\.\."/);
        assert.match(markup, /aria-label="Thông báo"/);
        assert.match(markup, /aria-label="Ảnh đại diện Cloudian"/);
        assert.match(markup, />Cloudian</);
    });

    it('omits the sidebar trigger when no menu handler is provided', () => {
        const markup = renderHeader(false);

        assert.doesNotMatch(markup, /aria-label="Mở menu"/);
    });
});
