
import { useMutation } from "@tanstack/react-query";
import {
  login,
  refreshToken,
  logout,
  logoutAll,
  type LoginRequest,
  type RefreshRequest,
} from "./services/auth.service";
import { setTokens } from "./token-storage";

export function useLoginMutation() {
  return useMutation({
    mutationKey: ["auth", "login"],
    mutationFn: (request: LoginRequest) => login(request),
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
    },
  });
}

export function useRefreshTokenMutation() {
  return useMutation({
    mutationKey: ["auth", "refresh"],
    mutationFn: (request: RefreshRequest) => refreshToken(request),
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
    },
  });
}

export function useLogoutMutation() {
  return useMutation({
    mutationKey: ["auth", "logout"],
    mutationFn: (refreshTokenValue: string) => logout(refreshTokenValue),
  });
}

export function useLogoutAllMutation() {
  return useMutation({
    mutationKey: ["auth", "logout-all"],
    mutationFn: () => logoutAll(),
  });
}
