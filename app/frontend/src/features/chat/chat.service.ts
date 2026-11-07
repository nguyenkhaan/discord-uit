import { privateClient } from '@/api/client';
import type { ChatHistoryResponse } from '@/features/chat/chat.type';

export const CHAT_HISTORY_PAGE_SIZE = 30;

/** Lấy lịch sử chat, `before` là cursor của trang trước */
export async function getChatHistory(
    serverId: string,
    before?: string,
    limit: number = CHAT_HISTORY_PAGE_SIZE
): Promise<ChatHistoryResponse> {
    const response = await privateClient.get<ChatHistoryResponse>(
        `/servers/${serverId}/messages`,
        { params: { before, limit } }
    );
    return response.data;
}
