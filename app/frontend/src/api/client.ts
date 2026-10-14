
import axios from "axios";
import type {
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from "../features/auth/token-storage";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const createClient = () =>
  axios.create({
    baseURL: BASE_URL,
    headers: {
      "Content-Type": "application/json",
    },
    timeout: 30000,
  });

export const publicClient = createClient();
export const privateClient = createClient();

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

// Gắn access token vào các request cần xác thực.
privateClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = getAccessToken();

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  }
);

// Tránh nhiều request đồng thời refresh token nhiều lần.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    throw new Error("Refresh token không tồn tại.");
  }

  if (!refreshPromise) {
    refreshPromise = publicClient
      .post<{
        accessToken: string;
        refreshToken: string;
      }>("/api/auth/refresh", { refreshToken })
      .then(({ data }) => {
        setTokens(data.accessToken, data.refreshToken);
        return data.accessToken;
      })
      .catch((error) => {
        clearTokens();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

// Chỉ tự refresh cho request private; không refresh request login.
privateClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | RetryableRequestConfig
      | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    // Đánh dấu để không lặp refresh vô hạn.
    originalRequest._retry = true;

    try {
      const newAccessToken = await refreshAccessToken();

      originalRequest.headers.Authorization =
        `Bearer ${newAccessToken}`;

      return privateClient(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }
);
