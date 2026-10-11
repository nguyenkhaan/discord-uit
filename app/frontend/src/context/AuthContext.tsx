
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

import {
  useLoginMutation,
  useLogoutMutation,
  useLogoutAllMutation,
} from "../features/auth/auth.hooks";

import {
  getAccessToken,
  getRefreshToken,
  clearTokens,
} from "../features/auth/token-storage";

import type { LoginRequest } from "../features/auth/services/auth.service";

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoggingIn: boolean;
  login: (request: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => Boolean(getAccessToken())
  );

  const loginMutation = useLoginMutation();
  const logoutMutation = useLogoutMutation();
  const logoutAllMutation = useLogoutAllMutation();

  async function login(request: LoginRequest): Promise<void> {
    const tokens = await loginMutation.mutateAsync(request);

    // useLoginMutation đã lưu token trong token-storage.
    if (tokens.accessToken) {
      setIsAuthenticated(true);
    }
  }

  async function logout(): Promise<void> {
    const refreshToken = getRefreshToken();

    try {
      if (refreshToken) {
        await logoutMutation.mutateAsync(refreshToken);
      }
    } finally {
      clearTokens();
      setIsAuthenticated(false);
    }
  }

  async function logoutAll(): Promise<void> {
    try {
      await logoutAllMutation.mutateAsync();
    } finally {
      clearTokens();
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

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
