import { useMutation } from '@tanstack/react-query';
import {
    login,
    logout,
    logoutAll,
    refreshToken,
} from '@/features/auth/auth.service';
import type {
    AuthenticationTokens,
    LoginRequest,
    RefreshRequest,
} from '@/features/auth/auth.type';
import { setTokens } from '@/features/auth/token-storage';

function persistAuthenticationTokens({
    accessToken,
    refreshToken,
}: AuthenticationTokens): void {
    setTokens(accessToken, refreshToken);
}

export function useLoginMutation() {
    return useMutation({
        mutationKey: ['auth', 'login'],
        mutationFn: (request: LoginRequest) => login(request),
        onSuccess: persistAuthenticationTokens,
    });
}

export function useRefreshTokenMutation() {
    return useMutation({
        mutationKey: ['auth', 'refresh'],
        mutationFn: (request: RefreshRequest) => refreshToken(request),
        onSuccess: persistAuthenticationTokens,
    });
}

export function useLogoutMutation() {
    return useMutation({
        mutationKey: ['auth', 'logout'],
        mutationFn: (refreshTokenValue: string) => logout(refreshTokenValue),
    });
}

export function useLogoutAllMutation() {
    return useMutation({
        mutationKey: ['auth', 'logout-all'],
        mutationFn: () => logoutAll(),
    });
}
