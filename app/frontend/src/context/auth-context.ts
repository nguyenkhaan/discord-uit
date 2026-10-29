import { createContext } from 'react';

import type { CurrentUser, LoginRequest } from '@/features/auth/auth.type';

export interface AuthContextValue {
    user: CurrentUser | null;
    isAuthenticated: boolean;
    isInitializing: boolean;
    isLoggingIn: boolean;
    login: (request: LoginRequest) => Promise<void>;
    logout: () => Promise<void>;
    logoutAll: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
    undefined
);
