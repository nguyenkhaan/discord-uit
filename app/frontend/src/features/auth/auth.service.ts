// src/features/auth/auth.service.ts
import { privateClient, publicClient } from '@/api/client';
import type { components } from '@/contract/api-contract';

type LoginRequest = components['schemas']['LoginRequest'];
type LoginResponse = components['schemas']['LoginResponse'];

type ForgotPasswordRequest = components['schemas']['ForgotPasswordRequest'];
type ResetPasswordRequest = components['schemas']['ResetPasswordRequest'];
type ChangePasswordRequest = components['schemas']['ChangePasswordRequest'];
// SỬA LỖI HÌNH 3: Đổi tên schema thành EmailChangeRequest cho khớp với OpenAPI
type EmailChangeRequest = components['schemas']['EmailChangeRequest'];

const AUTH_ENDPOINTS = {
    login: '/api/auth/login',
    refresh: '/api/auth/refresh',
    logout: '/api/auth/logout',
    logoutAll: '/api/auth/logout-all',
    forgotPassword: '/api/auth/forgot-password',
    resetPassword: '/api/auth/reset-password',
    changePassword: '/api/auth/change-password',
    changeEmail: '/api/auth/change-email', // Đường dẫn API có thể giữ nguyên
} as const;

export async function login(request: LoginRequest): Promise<LoginResponse> {
    const response = await publicClient.post<LoginResponse>(
        AUTH_ENDPOINTS.login,
        request
    );
    return response.data;
}

export async function refreshToken(): Promise<void> {
    await publicClient.post(AUTH_ENDPOINTS.refresh);
}

export async function logout(): Promise<void> {
    await privateClient.post(AUTH_ENDPOINTS.logout);
}

export async function logoutAll(): Promise<void> {
    await privateClient.post(AUTH_ENDPOINTS.logoutAll);
}

export async function forgotPassword(request: ForgotPasswordRequest): Promise<void> {
    await publicClient.post(AUTH_ENDPOINTS.forgotPassword, request);
}

export async function resetPassword(request: ResetPasswordRequest): Promise<void> {
    await publicClient.post(AUTH_ENDPOINTS.resetPassword, request);
}

export async function changePassword(request: ChangePasswordRequest): Promise<void> {
    await privateClient.post(AUTH_ENDPOINTS.changePassword, request);
}

export async function changeEmail(request: EmailChangeRequest): Promise<void> {
    await privateClient.post(AUTH_ENDPOINTS.changeEmail, request);
}