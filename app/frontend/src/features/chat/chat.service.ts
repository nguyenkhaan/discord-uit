import { privateClient } from '@/api/client';
import type {
    ChatAttachmentDto,
    ChatHistoryResponse,
    ChatMessageResponse,
    EditChatMessageRequest,
    DeleteChatMessageRequest
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

/** Sửa nội dung một tin nhắn */
export async function editChatMessage(
    serverId: string,
    messageId: string,
    contentText: string
): Promise<ChatMessageResponse> {
    const body: EditChatMessageRequest = { contentText };
    const response = await privateClient.patch<ChatMessageResponse>(
        `/servers/${serverId}/messages/${messageId}`,
        body
    );
    return response.data;
}

/** Thu hồi (xoá mềm) một tin nhắn; owner gỡ tin người khác phải kèm lý do */
export async function deleteChatMessage(
    serverId: string,
    messageId: string,
    reason?: string
): Promise<ChatMessageResponse> {
    const body: DeleteChatMessageRequest | undefined = reason
        ? { reason }
        : undefined;
    // axios: body của DELETE phải đặt trong `data`
    const response = await privateClient.delete<ChatMessageResponse>(
        `/servers/${serverId}/messages/${messageId}`,
        { data: body }
    );
    return response.data;
}
