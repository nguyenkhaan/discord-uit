import type { operations } from '@/contract/api-contract';

type LoginRequestBody =
    operations['login']['requestBody']['content']['application/json'];

export type LoginRequest = Required<LoginRequestBody>;

export type LoginResponse =
    operations['login']['responses'][200]['content']['*/*'];

export type RefreshRequest =
    operations['refresh']['requestBody']['content']['application/json'];

export type LogoutRequest =
    operations['logout']['requestBody']['content']['application/json'];

export type AuthenticationTokens = Required<
    Pick<LoginResponse, 'accessToken' | 'refreshToken'>
>;
