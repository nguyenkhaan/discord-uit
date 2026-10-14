import { privateClient, publicClient } from '@/api/client';
import type {
    AuthenticationTokens,
    LoginRequest,
    LoginResponse,
    LogoutRequest,
    RefreshRequest,
} from '@/features/auth/auth.type';

const AUTH_ENDPOINTS = {
    login: '/api/auth/login',
    refresh: '/api/auth/refresh',
    logout: '/api/auth/logout',
    logoutAll: '/api/auth/logout-all',
} as const;

function requireAuthenticationTokens(
    response: LoginResponse
): AuthenticationTokens {
    const { accessToken, refreshToken } = response;

    if (!accessToken || !refreshToken) {
        throw new Error('Login response is missing authentication tokens.');
    }

    return { accessToken, refreshToken };
}

export async function login(
    request: LoginRequest
): Promise<AuthenticationTokens> {
    const { data } = await publicClient.post<LoginResponse>(
        AUTH_ENDPOINTS.login,
        request
    );

    return requireAuthenticationTokens(data);
}

export async function refreshToken(
    request: RefreshRequest
): Promise<AuthenticationTokens> {
    const { data } = await publicClient.post<LoginResponse>(
        AUTH_ENDPOINTS.refresh,
        request
    );

    return requireAuthenticationTokens(data);
}

export async function logout(
    refreshTokenValue: LogoutRequest['refreshToken']
): Promise<void> {
    await privateClient.post(AUTH_ENDPOINTS.logout, {
        refreshToken: refreshTokenValue,
    });
}

export async function logoutAll(): Promise<void> {
    await privateClient.post(AUTH_ENDPOINTS.logoutAll);
}
