import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import Avatar from '@/components/Avatar';
import { AuthContext, type AuthContextValue } from '@/context/auth-context';
import type { CurrentUser } from '@/features/auth/auth.type';

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

function renderAvatar(user: CurrentUser) {
    return renderToStaticMarkup(
        <AuthContext.Provider value={{ ...authContextValue, user }}>
            <MemoryRouter>
                <Avatar />
            </MemoryRouter>
        </AuthContext.Provider>
    );
}

describe('Avatar account menu', () => {
    it('shows the admin dashboard option only for an admin', () => {
        const adminMarkup = renderAvatar({ ...baseUser, systemRole: 'ADMIN' });
        const userMarkup = renderAvatar(baseUser);

        assert.match(adminMarkup, />Admin Dashboard</);
        assert.doesNotMatch(userMarkup, />Admin Dashboard</);
    });
});
