import { useMutation } from '@tanstack/react-query';
import {
    login,
    logout,
    logoutAll,
    refreshToken,
} from '@/features/auth/auth.service';
import type { LoginRequest } from '@/features/auth/auth.type';

export function useLoginMutation() {
    return useMutation({
        mutationKey: ['auth', 'login'],
        mutationFn: (request: LoginRequest) => login(request),
    });
}

export function useRefreshTokenMutation() {
    return useMutation({
        mutationKey: ['auth', 'refresh'],
        mutationFn: refreshToken,
    });
}

export function useLogoutMutation() {
    return useMutation({
        mutationKey: ['auth', 'logout'],
        mutationFn: logout,
    });
}

export function useLogoutAllMutation() {
    return useMutation({
        mutationKey: ['auth', 'logout-all'],
        mutationFn: () => logoutAll(),
    });
}
