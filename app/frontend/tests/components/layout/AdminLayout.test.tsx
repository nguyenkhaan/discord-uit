import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { AuthContext, type AuthContextValue } from '@/context/auth-context';
import type { CurrentUser } from '@/features/auth/auth.type';
import { AdminLayout } from '@/features/admin/components/AdminLayout';

const baseUser: CurrentUser = {
    id: 'user-id',
    email: 'user@example.com',
    fullName: 'Test User',
    accountType: 'PERSONAL',
    accountStatus: 'ACTIVE',
    systemRole: 'USER',
    emailVerifiedAt: '2026-01-01T00:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
};

const authContextValue: AuthContextValue = {
    user: baseUser,
    isAuthenticated: true,
    isInitializing: false,
    isLoggingIn: false,
    login: async () => undefined,
    logout: async () => undefined,
    logoutAll: async () => undefined,
    refreshUser: async () => undefined,
};

function renderLayout(user: CurrentUser) {
    const queryClient = new QueryClient();

    return renderToStaticMarkup(
        <AuthContext.Provider value={{ ...authContextValue, user }}>
            <QueryClientProvider client={queryClient}>
                <MemoryRouter>
                    <AdminLayout />
                </MemoryRouter>
            </QueryClientProvider>
        </AuthContext.Provider>
    );
}

describe('AdminLayout', () => {
    it('does not render the admin shell for a non-admin user', () => {
        const markup = renderLayout(baseUser);

        assert.doesNotMatch(markup, /Mở menu quản trị/);
        assert.doesNotMatch(markup, /Khu vực quản trị/);
    });
});
