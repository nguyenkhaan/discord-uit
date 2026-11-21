import axios from 'axios';

import { privateClient } from '@/api/client';
import type {
    ActiveCallResponse,
    CallConnection,
    CallSessionStartResponse,
    LiveKitJoinResponse,
} from '@/features/call/call.type';

function callUrl(serverId: string): string {
    return `/servers/${serverId}/calls`;
}

function coordinatorStorageKey(serverId: string): string {
    return `uit-connect:call-coordinator:${serverId}`;
}

/** Returns the server's active call, or null when there is none (HTTP 204). */
export async function getActiveCall(
    serverId: string
): Promise<ActiveCallResponse | null> {
    const response = await privateClient.get<ActiveCallResponse | ''>(
        `${callUrl(serverId)}/active`
    );
    if (response.status === 204 || !response.data) return null;
    return response.data;
}

export async function startCall(
    serverId: string
): Promise<CallSessionStartResponse> {
    const response = await privateClient.post<CallSessionStartResponse>(
        callUrl(serverId)
    );
    return response.data;
}

export async function joinCall(serverId: string): Promise<LiveKitJoinResponse> {
    const response = await privateClient.post<LiveKitJoinResponse>(
        `${callUrl(serverId)}/join`
    );
    return response.data;
}

export async function endCall(serverId: string): Promise<void> {
    await privateClient.post(`${callUrl(serverId)}/end`);
    sessionStorage.removeItem(coordinatorStorageKey(serverId));
}

function getHttpStatus(error: unknown): number | undefined {
    return axios.isAxiosError(error) ? error.response?.status : undefined;
}

/**
 * Join an existing active call. If the server has no active call, create one
 * and then join it. A 409 during creation can mean another request won the
 * race, in which case we retry joining the existing call.
 */
export async function joinOrStartCall(
    serverId: string
): Promise<CallConnection> {
    try {
        const response = await joinCall(serverId);
        const storedRoomName = sessionStorage.getItem(
            coordinatorStorageKey(serverId)
        );
        const isCoordinator = storedRoomName === response.roomName;

        if (storedRoomName && !isCoordinator) {
            sessionStorage.removeItem(coordinatorStorageKey(serverId));
        }

        return { response, isCoordinator };
    } catch (joinError) {
        if (getHttpStatus(joinError) !== 404) {
            throw joinError;
        }
    }

    try {
        const createdCall = await startCall(serverId);
        sessionStorage.setItem(
            coordinatorStorageKey(serverId),
            createdCall.roomName
        );
        const response = await joinCall(serverId);
        return { response, isCoordinator: true };
    } catch (startError) {
        if (getHttpStatus(startError) !== 409) {
            throw startError;
        }

        return {
            response: await joinCall(serverId),
            isCoordinator: false,
        };
    }
}

export function getCallErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        const responseData: unknown = error.response?.data;
        if (
            typeof responseData === 'object' &&
            responseData !== null &&
            'message' in responseData &&
            typeof responseData.message === 'string'
        ) {
            return responseData.message;
        }

        if (error.response?.status === 403) {
            return 'Bạn không có quyền tham gia hoặc điều khiển cuộc gọi này.';
        }
        if (error.response?.status === 404) {
            return 'Không tìm thấy cuộc gọi hoặc bạn không còn quyền truy cập Server.';
        }
        if (error.response?.status === 409) {
            return 'Cuộc gọi đang ở trạng thái không phù hợp. Hãy thử tải lại.';
        }
        if (!error.response) {
            return 'Không thể kết nối tới Backend. Hãy kiểm tra máy chủ và mạng.';
        }
    }

    if (error instanceof Error && error.message) return error.message;
    return 'Đã xảy ra lỗi khi thực hiện cuộc gọi.';
}
