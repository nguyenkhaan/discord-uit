import { privateClient } from '@/api/client';
import type {
    ChatAttachmentDto,
    AddMessageReactionRequest,
    ChatHistoryResponse,
    MessageReactionList,
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

function reactionsUrl(serverId: string, messageId: string): string {
    return `/servers/${serverId}/messages/${messageId}/reactions`;
}

/** Reaction của một tin */
export async function getMessageReactions(
    serverId: string,
    messageId: string
): Promise<MessageReactionList> {
    const response = await privateClient.get<MessageReactionList>(
        reactionsUrl(serverId, messageId)
    );
    return response.data;
}

/** Thả hoặc đổi reaction của mình */
export async function addMessageReaction(
    serverId: string,
    messageId: string,
    iconId: string
): Promise<MessageReactionList> {
    const body: AddMessageReactionRequest = { iconId };
    const response = await privateClient.post<MessageReactionList>(
        reactionsUrl(serverId, messageId),
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

/** Bỏ reaction của mình */
export async function removeMessageReaction(
    serverId: string,
    messageId: string
): Promise<MessageReactionList> {
    const response = await privateClient.delete<MessageReactionList>(
        reactionsUrl(serverId, messageId)
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
