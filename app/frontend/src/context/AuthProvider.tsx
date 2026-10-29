import { useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { AuthContext } from '@/context/auth-context';
import {
    authKeys,
    fetchCurrentUser,
    useLoginMutation,
    useLogoutAllMutation,
    useLogoutMutation,
    useMeQuery,
} from '@/features/auth/auth.hooks';
import type { LoginRequest } from '@/features/auth/auth.type';

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const queryClient = useQueryClient();

    const meQuery = useMeQuery();
    const loginMutation = useLoginMutation();
    const logoutMutation = useLogoutMutation();
    const logoutAllMutation = useLogoutAllMutation();

    const user = meQuery.data ?? null;

    async function login(request: LoginRequest): Promise<void> {
        await loginMutation.mutateAsync(request);

        // Đăng nhập xong: lấy ngay user mới và ghi vào cache của query /me
        const me = await queryClient.fetchQuery({
            queryKey: authKeys.me,
            queryFn: fetchCurrentUser,
        });

        if (!me) {
            throw new Error('Không lấy được thông tin người dùng sau khi đăng nhập.');
        }
    }

    function clearSession() {
        queryClient.setQueryData(authKeys.me, null);
    }

    async function logout(): Promise<void> {
        try {
            await logoutMutation.mutateAsync();
        } finally {
            clearSession();
        }
    }

    async function logoutAll(): Promise<void> {
        try {
            await logoutAllMutation.mutateAsync();
        } finally {
            clearSession();
        }
    }

    async function refreshUser(): Promise<void> {
        await queryClient.invalidateQueries({ queryKey: authKeys.me });
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: user !== null,
                isInitializing: meQuery.isPending,
                isLoggingIn: loginMutation.isPending,
                login,
                logout,
                logoutAll,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}