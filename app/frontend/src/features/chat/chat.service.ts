import { privateClient } from '@/api/client';
import type {
    ChatAttachmentDto,
    ChatHistoryResponse,
} from '@/features/chat/chat.type';

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

/** Upload 1 ảnh để gửi kèm tin nhắn */
export async function uploadChatAttachment(
    serverId: string,
    file: File
): Promise<ChatAttachmentDto> {
    const formData = new FormData();
    formData.append('file', file);
    // Trình duyệt tự gắn boundary cho multipart
    const response = await privateClient.post<ChatAttachmentDto>(
        `/servers/${serverId}/attachments`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
}
