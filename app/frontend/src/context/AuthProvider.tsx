import { useState, type ReactNode } from 'react';

import { AuthContext } from '@/context/auth-context';
import {
    useLoginMutation,
    useLogoutAllMutation,
    useLogoutMutation,
} from '@/features/auth/auth.hooks';
import type { LoginRequest } from '@/features/auth/auth.type';

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const loginMutation = useLoginMutation();
    const logoutMutation = useLogoutMutation();
    const logoutAllMutation = useLogoutAllMutation();

    async function login(request: LoginRequest): Promise<void> {
        await loginMutation.mutateAsync(request);
        setIsAuthenticated(true);
    }

    async function logout(): Promise<void> {
        try {
            await logoutMutation.mutateAsync();
        } finally {
            setIsAuthenticated(false);
        }
    }

    async function logoutAll(): Promise<void> {
        try {
            await logoutAllMutation.mutateAsync();
        } finally {
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
