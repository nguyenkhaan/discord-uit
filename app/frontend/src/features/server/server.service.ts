import { privateClient } from '@/api/client';
import type {
    CreateServerPayload,
    ServerResponse,
    ServerStatusCountResponse,
    ServerStatusFilter,
    UpdateServerStatusPayload,
    UpdateServerStatusRequest,
} from '@/features/server/server.type';

export const SERVERS_ENDPOINT = '/servers';

/**
 * Spring nhận `Set<ServerStatus>` dạng `?status=ACTIVE&status=LOCKED`.
 * Axios mặc định serialize mảng thành `status[]=...` nên phải tự build params.
 */
function toStatusParams({ statuses }: ServerStatusFilter = {}): URLSearchParams {
    const params = new URLSearchParams();
    statuses?.forEach((status) => params.append('status', status));
    return params;
}

/** GET /servers — danh sách server mà người dùng hiện tại là thành viên */
export async function listMyServers(filter?: ServerStatusFilter): Promise<ServerResponse[]> {
    const response = await privateClient.get<ServerResponse[]>(SERVERS_ENDPOINT, {
        params: toStatusParams(filter),
    });
    return response.data;
}

/** GET /servers/status-counts — số server theo trạng thái */
export async function countMyServersByStatus(
    filter?: ServerStatusFilter
): Promise<ServerStatusCountResponse[]> {
    const response = await privateClient.get<ServerStatusCountResponse[]>(
        `${SERVERS_ENDPOINT}/status-counts`,
        { params: toStatusParams(filter) }
    );
    return response.data;
}

/** GET /servers/{serverId} */
export async function getServer(serverId: string): Promise<ServerResponse> {
    const response = await privateClient.get<ServerResponse>(`${SERVERS_ENDPOINT}/${serverId}`);
    return response.data;
}

/** POST /servers (multipart/form-data) */
export async function createServer({ name, image }: CreateServerPayload): Promise<ServerResponse> {
    const formData = new FormData();
    formData.append('name', name);
    if (image) formData.append('image', image);

    // Ghi đè Content-Type JSON mặc định của client; trình duyệt sẽ tự gắn boundary
    const response = await privateClient.post<ServerResponse>(SERVERS_ENDPOINT, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
}

/** PATCH /servers/{serverId}/status — chỉ OWNER */
export async function updateServerStatus({
    serverId,
    status,
}: UpdateServerStatusPayload): Promise<ServerResponse> {
    const body: UpdateServerStatusRequest = { status };
    const response = await privateClient.patch<ServerResponse>(
        `${SERVERS_ENDPOINT}/${serverId}/status`,
        body
    );
    return response.data;
}
