import { privateClient, publicClient } from '@/api/client';
import type {
    LoginRequest,
    LoginResponse,
} from '@/features/auth/auth.type';

const AUTH_ENDPOINTS = {
    login: '/api/auth/login',
    refresh: '/api/auth/refresh',
    logout: '/api/auth/logout',
    logoutAll: '/api/auth/logout-all',
} as const;

export async function login(
    request: LoginRequest
): Promise<void> {
    await publicClient.post<LoginResponse>(
        AUTH_ENDPOINTS.login,
        request
    );
}

export async function refreshToken(): Promise<void> {
    await publicClient.post<LoginResponse>(AUTH_ENDPOINTS.refresh);
}

export async function logout(): Promise<void> {
    await privateClient.post(AUTH_ENDPOINTS.logout);
}

export async function logoutAll(): Promise<void> {
    await privateClient.post(AUTH_ENDPOINTS.logoutAll);
}
