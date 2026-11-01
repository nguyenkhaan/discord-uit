import { privateClient } from '@/api/client';
import { SERVERS_ENDPOINT } from '@/features/server/server.service';
import type { ServerMemberResponse, ServerMemberTarget } from '@/features/server/server.type';

/** GET /servers/{serverId}/members */
export async function listServerMembers(serverId: string): Promise<ServerMemberResponse[]> {
    const response = await privateClient.get<ServerMemberResponse[]>(
        `${SERVERS_ENDPOINT}/${serverId}/members`
    );
    return response.data;
}

/** POST /servers/{serverId}/members/{userId}/promote — chỉ OWNER */
export async function promoteServerMember({ serverId, userId }: ServerMemberTarget): Promise<void> {
    await privateClient.post(`${SERVERS_ENDPOINT}/${serverId}/members/${userId}/promote`);
}

/** DELETE /servers/{serverId}/members/{userId} — chỉ OWNER */
export async function kickServerMember({ serverId, userId }: ServerMemberTarget): Promise<void> {
    await privateClient.delete(`${SERVERS_ENDPOINT}/${serverId}/members/${userId}`);
}

/** POST /servers/{serverId}/leave */
export async function leaveServer(serverId: string): Promise<void> {
    await privateClient.post(`${SERVERS_ENDPOINT}/${serverId}/leave`);
}
