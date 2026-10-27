import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { Sidebar } from '@/components/layout/Sidebar';

function renderSidebar(path: string, isOpen = false) {
    return renderToStaticMarkup(
        <MemoryRouter initialEntries={[path]}>
            <Sidebar isOpen={isOpen} onClose={() => undefined} />
        </MemoryRouter>
    );
}

describe('Sidebar', () => {
    it('renders the complete navigation and marks the route from the current URL', () => {
        const markup = renderSidebar('/servers', true);

        assert.match(markup, /aria-label="Điều hướng chính"/);
        assert.match(markup, /alt="UIT Connect"/);
        assert.match(markup, /href="\/home"[^>]*>.*Trang chủ/);
        assert.match(
            markup,
            /<a(?=[^>]*aria-current="page")(?=[^>]*href="\/servers")[^>]*>.*Server/
        );
        assert.match(markup, /href="\/documents"[^>]*>.*Tài liệu/);
        assert.match(markup, /href="\/forum"[^>]*>.*Diễn đàn/);
        assert.match(markup, /href="\/notifications"[^>]*>.*Thông báo/);
        assert.match(markup, /aria-label="Đóng menu"/);
    });

    it('is hidden off-canvas on mobile while remaining visible on desktop', () => {
        const markup = renderSidebar('/home');

        assert.match(markup, /-translate-x-full/);
        assert.match(markup, /invisible/);
        assert.match(markup, /md:translate-x-0/);
        assert.match(markup, /md:visible/);
        assert.doesNotMatch(markup, /overflow-x-auto/);
    });

    it('centers the Cloudian identity in a footer at the bottom', () => {
        const markup = renderSidebar('/home', true);

        assert.match(
            markup,
            /class="[^"]*mt-auto[^"]*justify-center[^"]*border-t[^"]*"/
        );
        assert.match(markup, /aria-label="Ảnh đại diện Cloudian"/);
        assert.match(markup, />Cloudian</);
    });
});
