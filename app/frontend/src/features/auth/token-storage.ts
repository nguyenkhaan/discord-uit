let accessToken: string | null = null;
let refreshTokenValue: string | null = null;

export function setTokens(
    newAccessToken: string,
    newRefreshToken: string
): void {
    accessToken = newAccessToken;
    refreshTokenValue = newRefreshToken;
}

export function getAccessToken(): string | null {
    return accessToken;
}

export function getRefreshToken(): string | null {
    return refreshTokenValue;
}

export function clearTokens(): void {
    accessToken = null;
    refreshTokenValue = null;
}
