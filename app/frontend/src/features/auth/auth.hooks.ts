// src/features/auth/auth.hooks.ts
import { useMutation } from '@tanstack/react-query';
import {
    login,
    logout,
    logoutAll,
    refreshToken,
    forgotPassword,
    resetPassword,
    changePassword,
    changeEmail
} from '@/features/auth/auth.service';
import type { components } from '@/contract/api-contract';

type LoginRequest = components['schemas']['LoginRequest'];
type ForgotPasswordRequest = components['schemas']['ForgotPasswordRequest'];
type ResetPasswordRequest = components['schemas']['ResetPasswordRequest'];
type ChangePasswordRequest = components['schemas']['ChangePasswordRequest'];
// SỬA LỖI HÌNH 3
type EmailChangeRequest = components['schemas']['EmailChangeRequest'];

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
        mutationFn: logoutAll,
    });
}

export function useForgotPasswordMutation() {
    return useMutation({
        mutationKey: ['auth', 'forgot-password'],
        mutationFn: (request: ForgotPasswordRequest) => forgotPassword(request),
    });
}

export function useResetPasswordMutation() {
    return useMutation({
        mutationKey: ['auth', 'reset-password'],
        mutationFn: (request: ResetPasswordRequest) => resetPassword(request),
    });
}

export function useChangePasswordMutation() {
    return useMutation({
        mutationKey: ['auth', 'change-password'],
        mutationFn: (request: ChangePasswordRequest) => changePassword(request),
    });
}

export function useChangeEmailMutation() {
    return useMutation({
        mutationKey: ['auth', 'change-email'],
        mutationFn: (request: EmailChangeRequest) => changeEmail(request),
    });
}