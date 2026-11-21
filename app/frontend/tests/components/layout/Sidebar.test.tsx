import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { Sidebar } from '@/components/layout/Sidebar';
import { AuthContext, type AuthContextValue } from '@/context/auth-context';

const authContextValue: AuthContextValue = {
    user: null,
    isAuthenticated: false,
    isInitializing: false,
    isLoggingIn: false,
    login: async () => undefined,
    logout: async () => undefined,
    logoutAll: async () => undefined,
    refreshUser: async () => undefined,
};

function renderSidebar(path: string, isOpen = false) {
    return renderToStaticMarkup(
        <AuthContext.Provider value={authContextValue}>
            <MemoryRouter initialEntries={[path]}>
                <Sidebar isOpen={isOpen} onClose={() => undefined} />
            </MemoryRouter>
        </AuthContext.Provider>
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

    it('renders the Cloudian identity in the account footer', () => {
        const markup = renderSidebar('/home', true);

        assert.match(
            markup,
            /class="[^"]*w-full[^"]*flex[^"]*items-center[^"]*justify-between[^"]*border-t[^"]*"/
        );
        assert.match(markup, /aria-label="Ảnh đại diện Cloudian"/);
        assert.match(markup, />Cloudian</);
    });
});
