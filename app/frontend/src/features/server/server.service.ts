import { privateClient } from '@/api/client';
import type { components } from '@/contract/api-contract';

export type ServerResponse = components['schemas']['ServerResponse'];
export type ServerMemberResponse =
    components['schemas']['ServerMemberResponse'];

const SERVERS_ENDPOINT = '/servers';

export async function getServers(): Promise<ServerResponse[]> {
    const response =
        await privateClient.get<ServerResponse[]>(SERVERS_ENDPOINT);
    return response.data;
}

export async function getServer(serverId: string): Promise<ServerResponse> {
    const response = await privateClient.get<ServerResponse>(
        `${SERVERS_ENDPOINT}/${serverId}`
    );
    return response.data;
}

export async function getServerMembers(
    serverId: string
): Promise<ServerMemberResponse[]> {
    const response = await privateClient.get<ServerMemberResponse[]>(
        `${SERVERS_ENDPOINT}/${serverId}/members`
    );
    return response.data;
}

export async function createServer(
    formData: FormData
): Promise<ServerResponse> {
    const response = await privateClient.post<ServerResponse>(
        SERVERS_ENDPOINT,
        formData
    );
    return response.data;
}
