import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { Header } from '@/components/Header/Header';
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

function renderHeader(withMenu = true) {
    const queryClient = new QueryClient();

    return renderToStaticMarkup(
        <AuthContext.Provider value={authContextValue}>
            <QueryClientProvider client={queryClient}>
                <MemoryRouter>
                    <Header
                        onMenuClick={withMenu ? () => undefined : undefined}
                    />
                </MemoryRouter>
            </QueryClientProvider>
        </AuthContext.Provider>
    );
}

describe('Header', () => {
    it('renders search, notifications, and an accessible account trigger', () => {
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
        assert.match(markup, /aria-label="Tài khoản Cloudian"/);
        assert.match(markup, /aria-haspopup="menu"/);
        assert.match(markup, /aria-controls="[^"]+"/);
        assert.match(markup, /aria-expanded="false"/);
        assert.match(markup, /role="menu"/);
        assert.match(markup, />Profile</);
        assert.match(markup, />Logout</);
        assert.match(markup, />Cloudian</);
    });

    it('omits the sidebar trigger when no menu handler is provided', () => {
        const markup = renderHeader(false);

        assert.doesNotMatch(markup, /aria-label="Mở menu"/);
    });
});
