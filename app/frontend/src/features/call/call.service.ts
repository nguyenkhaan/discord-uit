import axios from 'axios';

import { privateClient } from '@/api/client';
import type {
    ActiveCallResponse,
    CallSessionStartResponse,
    LiveKitJoinResponse,
} from '@/features/call/call.type';

function callUrl(serverId: string): string {
    return `/servers/${serverId}/calls`;
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
}

export async function startScreenShare(serverId: string): Promise<void> {
    await privateClient.post(`${callUrl(serverId)}/screen-share`);
}

export async function stopScreenShare(serverId: string): Promise<void> {
    await privateClient.delete(`${callUrl(serverId)}/screen-share`);
}

export async function forceMute(
    serverId: string,
    targetUserId: string
): Promise<void> {
    await privateClient.post(
        `${callUrl(serverId)}/participants/${targetUserId}/force-mute`
    );
}

export async function forceStopScreenShare(
    serverId: string,
    targetUserId: string
): Promise<void> {
    await privateClient.post(
        `${callUrl(serverId)}/participants/${targetUserId}/force-stop-screen-share`
    );
}

function getHttpStatus(error: unknown): number | undefined {
    return axios.isAxiosError(error) ? error.response?.status : undefined;
}

/**
 * Join the active call, or create one first when there is none (404).
 * A 409 while creating means another request won the race: just join it.
 * The coordinator is decided by the backend (coordinatorUserId).
 */
export async function joinOrStartCall(
    serverId: string
): Promise<LiveKitJoinResponse> {
    try {
        return await joinCall(serverId);
    } catch (joinError) {
        if (getHttpStatus(joinError) !== 404) throw joinError;
    }

    try {
        await startCall(serverId);
    } catch (startError) {
        if (getHttpStatus(startError) !== 409) throw startError;
    }

    return joinCall(serverId);
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

export function getScreenShareErrorMessage(error: unknown): string {
    const status = getHttpStatus(error);
    if (status === 409) {
        return 'Đang có người khác chia sẻ màn hình. Hãy đợi họ dừng rồi thử lại.';
    }
    if (status === 403 || status === 404) {
        return 'Bạn không còn ở trong cuộc gọi nên không thể chia sẻ màn hình.';
    }
    if (status === 502) {
        return 'Không cập nhật được quyền trên LiveKit. Vui lòng thử lại.';
    }
    if (error instanceof Error && error.name === 'DeviceUnsupportedError') {
        return 'Trình duyệt này không hỗ trợ chia sẻ màn hình.';
    }
    return getCallErrorMessage(error);
}

export function getControlErrorMessage(
    error: unknown,
    action: 'mute' | 'stop-share'
): string {
    const status = getHttpStatus(error);
    if (status === 403) {
        return 'Chỉ người điều phối đang có mặt trong cuộc gọi mới dùng được quyền điều khiển.';
    }
    if (status === 404) {
        return 'Người này không còn ở trong cuộc gọi.';
    }
    if (status === 409) {
        return action === 'mute'
            ? 'Microphone của người này đang tắt sẵn.'
            : 'Người này không còn chia sẻ màn hình.';
    }
    if (status === 502) {
        return 'LiveKit không phản hồi. Vui lòng thử lại.';
    }
    return getCallErrorMessage(error);
}