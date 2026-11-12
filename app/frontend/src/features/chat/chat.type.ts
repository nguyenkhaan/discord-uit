import type { components } from '@/contract/api-contract';

type Schemas = components['schemas'];

/** Tin nhắn nhận qua socket */
export type ChatMessageDto = Schemas['RealtimeChatMessageResponse'];

/** Lịch sử chat */
export type ChatHistoryResponse = Schemas['ChatMessageHistoryResponse'];
export type ChatHistoryItem = Schemas['ChatMessageHistoryItem'];

/** Trích dẫn tin được trả lời (từ BE) */
export type ChatReplyPreview = Schemas['ChatMessageReplyPreview'];

/** Kết quả vào room */
export type ServerRoomAuthorization =
    Schemas['RealtimeServerAuthorizationResponse'];

/* Type socket, theo realtime-gateway/src/contracts/realtime.ts */
export interface SocketError {
    code: string;
    message: string;
    retryable: boolean;
}

export type SocketAck<TData> =
    { ok: true; data: TData } | { ok: false; error: SocketError };

export interface ServerRoomCommand {
    serverId: string;
}

export interface ChatSendCommand {
    serverId: string;
    clientRequestId: string;
    contentText: string;
    /** Bỏ trống khi không reply */
    replyToMessageId?: string;
}

/** Tin được trả lời, dùng cho trích dẫn và thanh "Đang trả lời" */
export interface ChatReplyView {
    messageId: string;
    senderUserId: string;
    /** null khi tin gốc đã thu hồi */
    contentText: string | null;
    isDeleted: boolean;
}

/** Trạng thái gửi của tin nhắn */
export type ChatDeliveryStatus = 'sending' | 'sent' | 'failed';

export interface ChatMessageView {
    /** Key để render danh sách */
    key: string;
    messageId?: string;
    clientRequestId?: string;
    senderUserId: string;
    contentText: string;
    createdAt: string;
    status: ChatDeliveryStatus;
    isDeleted: boolean;
    errorMessage?: string;
    replyTo?: ChatReplyView;
}

/** Trạng thái kết nối phòng chat */
export type ChatConnectionStatus =
    | 'connecting'
    | 'joined'
    | 'reconnecting'
    | 'not-member'
    | 'unauthenticated'
    | 'error';

/** Ảnh đã chọn, chưa gửi (chưa có API upload) */
export interface ChatAttachmentDraft {
    id: string;
    file: File;
    previewUrl: string;
}
