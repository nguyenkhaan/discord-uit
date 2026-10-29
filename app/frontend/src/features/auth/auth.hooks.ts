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
    changeEmail,
} from '@/features/auth/auth.service';
import type { components } from '@/contract/api-contract';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

import { getMe } from './auth.service';
import type { CurrentUser } from './auth.type';

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

export const authKeys = {
    me: ['auth', 'me'] as const,
};

/** Trả về user nếu đã đăng nhập, null nếu chưa (thay vì ném lỗi). */
export async function fetchCurrentUser(): Promise<CurrentUser | null> {
    try {
        return await getMe();
    } catch (error) {
        // Spring Security có thể trả 401 hoặc 403 khi chưa đăng nhập
        if (axios.isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0)) {
            return null;
        }
        throw error;
    }
}

export function useMeQuery() {
    return useQuery({
        queryKey: authKeys.me,
        queryFn: fetchCurrentUser,
        retry: false,             // chưa đăng nhập thì đừng thử lại 3 lần
        staleTime: 5 * 60 * 1000, // 5 phút mới hỏi lại BE
    });
}