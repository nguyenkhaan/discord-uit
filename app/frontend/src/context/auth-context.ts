import { createContext } from "react";

import type { LoginRequest } from "@/features/auth/auth.service";

export interface AuthContextValue {
  isAuthenticated: boolean;
  isLoggingIn: boolean;
  login: (request: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);
