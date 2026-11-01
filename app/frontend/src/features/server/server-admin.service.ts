import { privateClient } from '@/api/client';
import type {
    AdminDeleteServerPayload,
    DeleteServerRequest,
    ServerMemberTarget,
} from '@/features/server/server.type';

const ADMIN_SERVERS_ENDPOINT = '/admin/servers';

/** DELETE /admin/servers/{serverId} — chỉ ADMIN, bắt buộc lý do xóa */
export async function adminDeleteServer({ serverId, reason }: AdminDeleteServerPayload): Promise<void> {
    const body: DeleteServerRequest = { reason };
    await privateClient.delete(`${ADMIN_SERVERS_ENDPOINT}/${serverId}`, { data: body });
}

/** DELETE /admin/servers/{serverId}/members/{userId} — chỉ ADMIN */
export async function adminKickServerMember({ serverId, userId }: ServerMemberTarget): Promise<void> {
    await privateClient.delete(`${ADMIN_SERVERS_ENDPOINT}/${serverId}/members/${userId}`);
}
