import { useState, type ReactNode } from 'react';

import { AuthContext } from '@/context/auth-context';
import {
    useLoginMutation,
    useLogoutAllMutation,
    useLogoutMutation,
} from '@/features/auth/auth.hooks';
import type { LoginRequest } from '@/features/auth/auth.type';
import {
    clearTokens,
    getAccessToken,
    getRefreshToken,
} from '@/features/auth/token-storage';

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [isAuthenticated, setIsAuthenticated] = useState(() =>
        Boolean(getAccessToken())
    );

    const loginMutation = useLoginMutation();
    const logoutMutation = useLogoutMutation();
    const logoutAllMutation = useLogoutAllMutation();

    async function login(request: LoginRequest): Promise<void> {
        const tokens = await loginMutation.mutateAsync(request);

        if (tokens.accessToken) {
            setIsAuthenticated(true);
        }
    }

    async function logout(): Promise<void> {
        const refreshToken = getRefreshToken();

        try {
            if (refreshToken) {
                await logoutMutation.mutateAsync(refreshToken);
            }
        } finally {
            clearTokens();
            setIsAuthenticated(false);
        }
    }

    async function logoutAll(): Promise<void> {
        try {
            await logoutAllMutation.mutateAsync();
        } finally {
            clearTokens();
            setIsAuthenticated(false);
        }
    }

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                isLoggingIn: loginMutation.isPending,
                login,
                logout,
                logoutAll,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
