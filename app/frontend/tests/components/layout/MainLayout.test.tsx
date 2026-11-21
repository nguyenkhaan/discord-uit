import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { MainLayout } from '@/components/layout/MainLayout';
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

describe('MainLayout', () => {
    it('composes the application shell and renders children once in main', () => {
        const queryClient = new QueryClient();
        const markup = renderToStaticMarkup(
            <AuthContext.Provider value={authContextValue}>
                <QueryClientProvider client={queryClient}>
                    <MemoryRouter initialEntries={['/home']}>
                        <MainLayout>
                            <section data-layout-child="true">
                                Nội dung trang
                            </section>
                        </MainLayout>
                    </MemoryRouter>
                </QueryClientProvider>
            </AuthContext.Provider>
        );

        assert.match(markup, /<header/);
        assert.match(markup, /<nav aria-label="Điều hướng chính"/);
        assert.match(markup, /<main[^>]*id="main-content"[^>]*>/);
        assert.match(markup, /md:pl-60/);
        assert.equal(markup.match(/data-layout-child="true"/g)?.length, 1);
        assert.match(markup, /<main[^>]*>.*Nội dung trang.*<\/main>/);
    });
});
