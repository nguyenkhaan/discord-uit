import type {components, operations } from '@/contract/api-contract';

type LoginRequestBody =
    operations['login']['requestBody']['content']['application/json'];

export type LoginRequest = Required<LoginRequestBody>;

export type LoginResponse =
    operations['login']['responses'][200]['content']['*/*'];

export type CurrentUser = Required<components['schemas']['MeResponse']>;