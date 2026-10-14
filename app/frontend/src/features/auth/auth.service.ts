
import { publicClient, privateClient } from "../../api/client";
export interface LoginRequest {
    username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export async function login(
  request: LoginRequest
): Promise<LoginResponse> {
  const { data } = await publicClient.post<LoginResponse>(
    "/api/auth/login",
    request
  );

  return data;
}

export async function refreshToken(
  request: RefreshRequest
): Promise<LoginResponse> {
  const { data } = await publicClient.post<LoginResponse>(
    "/api/auth/refresh",
    request
  );

  return data;
}

export async function logout(
  refreshTokenValue: string
): Promise<void> {
  await privateClient.post("/api/auth/logout", {
    refreshToken: refreshTokenValue,
  });
}

export async function logoutAll(): Promise<void> {
  await privateClient.post("/api/auth/logout-all");
}
