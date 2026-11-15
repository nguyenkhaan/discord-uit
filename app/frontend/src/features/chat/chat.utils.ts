import type {
    ChatAttachmentDto,
    ChatAttachmentView,
    ChatHistoryItem,
    ChatMessageDto,
    ChatMessageResponse,
    ChatMessageView,
    ChatReplyPreview,
    ChatReplyView,
} from '@/features/chat/chat.type';

/** Độ dài tối đa của tin nhắn */
export const MAX_CHAT_MESSAGE_LENGTH = 2000;

/** Khoảng thời gian gộp tin liên tiếp */
const MESSAGE_GROUP_WINDOW_MS = 5 * 60 * 1000;

// ---------------------------------------------------------------------------
// Reducer tin nhắn realtime
// ---------------------------------------------------------------------------

export type ChatAction =
    | { type: 'reset' }
    | { type: 'sending'; message: ChatMessageView }
    | { type: 'retrying'; clientRequestId: string }
    | { type: 'confirmed'; message: ChatMessageDto }
    | { type: 'failed'; clientRequestId: string; errorMessage: string };

/** Chuyển trích dẫn từ BE sang dạng hiển thị */
function toReplyView(
    preview: ChatReplyPreview | null | undefined
): ChatReplyView | undefined {
    if (!preview?.messageId || !preview.senderUserId) return undefined;
    return {
        messageId: preview.messageId,
        senderUserId: preview.senderUserId,
        contentText: preview.contentText ?? null,
        isDeleted: Boolean(preview.deleted),
    };
}

/** Chuyển ảnh từ BE sang dạng hiển thị */
function toAttachmentViews(
    attachments: ChatAttachmentDto[] | null | undefined
): ChatAttachmentView[] {
    return (attachments ?? []).flatMap((attachment) =>
        attachment.mediaId
            ? [
                  {
                      key: attachment.mediaId,
                      url: attachment.url ?? null,
                      fileName: attachment.fileName ?? 'Ảnh',
                  },
              ]
            : []
    );
}

function realtimeToView(dto: ChatMessageDto): ChatMessageView | null {
    const key = dto.clientRequestId ?? dto.messageId;
    // Tin chỉ có ảnh thì contentText rỗng
    if (!key || !dto.senderUserId || dto.contentText == null) return null;
    return {
        key,
        messageId: dto.messageId,
        clientRequestId: dto.clientRequestId,
        senderUserId: dto.senderUserId,
        contentText: dto.contentText,
        createdAt: dto.createdAt ?? new Date().toISOString(),
        status: 'sent',
        isDeleted: false,
        replyTo: toReplyView(dto.replyTo),
        attachments: toAttachmentViews(dto.attachments),
    };
}

function isSameMessage(view: ChatMessageView, dto: ChatMessageDto): boolean {
    return (
        (dto.messageId !== undefined && view.messageId === dto.messageId) ||
        (dto.clientRequestId !== undefined &&
            view.clientRequestId === dto.clientRequestId &&
            view.senderUserId === dto.senderUserId)
    );
}

function updateByClientRequestId(
    messages: ChatMessageView[],
    clientRequestId: string,
    patch: Partial<ChatMessageView>
): ChatMessageView[] {
    return messages.map((message) =>
        message.clientRequestId === clientRequestId
            ? { ...message, ...patch }
            : message
    );
}

/** Cập nhật danh sách tin nhắn realtime */
export function chatReducer(
    messages: ChatMessageView[],
    action: ChatAction
): ChatMessageView[] {
    switch (action.type) {
        case 'reset':
            return [];
        case 'sending':
            return [...messages, action.message];
        case 'retrying':
            return updateByClientRequestId(messages, action.clientRequestId, {
                status: 'sending',
                errorMessage: undefined,
            });
        case 'failed':
            return updateByClientRequestId(messages, action.clientRequestId, {
                status: 'failed',
                errorMessage: action.errorMessage,
            });
        case 'confirmed': {
            const view = realtimeToView(action.message);
            if (!view) return messages;
            const index = messages.findIndex((message) =>
                isSameMessage(message, action.message)
            );
            if (index === -1) return [...messages, view];
            const next = [...messages];
            // Giữ key cũ
            next[index] = { ...view, key: messages[index].key };
            return next;
        }
    }
}

// ---------------------------------------------------------------------------
// Gộp lịch sử với tin realtime
// ---------------------------------------------------------------------------

export const DELETED_MESSAGE_TEXT = 'Tin nhắn này đã bị thu hồi.';

function historyToView(item: ChatHistoryItem): ChatMessageView | null {
    if (!item.messageId || !item.senderUserId) return null;
    return {
        key: item.messageId,
        messageId: item.messageId,
        senderUserId: item.senderUserId,
        contentText: item.contentText ?? '',
        createdAt: item.createdAt ?? new Date(0).toISOString(),
        editedAt: item.editedAt,
        status: 'sent',
        isDeleted: Boolean(item.deleted),
        replyTo: toReplyView(item.replyTo),
        attachments: toAttachmentViews(item.attachments),
    };
}

/** Gộp lịch sử và tin realtime, xếp cũ đến mới, bỏ tin trùng */
export function mergeChatMessages(
    historyPages: ChatHistoryItem[][],
    liveMessages: ChatMessageView[]
): ChatMessageView[] {
    const history = historyPages
        .flat()
        .map(historyToView)
        .filter((view): view is ChatMessageView => view !== null)
        .reverse();
    const historyIds = new Set(history.map((view) => view.messageId));
    const live = liveMessages.filter(
        (message) => !message.messageId || !historyIds.has(message.messageId)
    );
    return [...history, ...live];
}

// ---------------------------------------------------------------------------
// Gộp tin và chèn mốc ngày
// ---------------------------------------------------------------------------

export type ChatTimelineItem =
    | { kind: 'day'; key: string; label: string }
    | {
          kind: 'message';
          key: string;
          message: ChatMessageView;
          isGroupStart: boolean;
      };

function startOfDay(date: Date): number {
    return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    ).getTime();
}

const dayFormatter = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
});

const DAY_MS = 24 * 60 * 60 * 1000;

export function formatChatDay(date: Date, now: Date = new Date()): string {
    const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS);
    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return 'Hôm qua';
    return dayFormatter.format(date);
}

export function formatChatTime(createdAt: string): string {
    const date = new Date(createdAt);
    return Number.isNaN(date.getTime()) ? '' : timeFormatter.format(date);
}

export function buildChatTimeline(
    messages: ChatMessageView[],
    now: Date = new Date()
): ChatTimelineItem[] {
    const items: ChatTimelineItem[] = [];
    let previous: ChatMessageView | undefined;

    for (const message of messages) {
        const date = new Date(message.createdAt);
        const previousDate = previous
            ? new Date(previous.createdAt)
            : undefined;
        const isNewDay =
            !previousDate || startOfDay(previousDate) !== startOfDay(date);

        if (isNewDay) {
            items.push({
                kind: 'day',
                key: `day-${startOfDay(date)}`,
                label: formatChatDay(date, now),
            });
        }

        const isGroupStart =
            isNewDay ||
            previous?.senderUserId !== message.senderUserId ||
            date.getTime() - (previousDate?.getTime() ?? 0) >
                MESSAGE_GROUP_WINDOW_MS;

        items.push({
            kind: 'message',
            key: message.key,
            message,
            isGroupStart,
        });
        previous = message;
    }
    return items;
}

// ---------------------------------------------------------------------------
// Link trong tin nhắn
// ---------------------------------------------------------------------------

const URL_PATTERN = /https?:\/\/[^\s<>"']+/g;
const TRAILING_PUNCTUATION = /[.,!?;:)\]]+$/;

export type ChatTextPart =
    { kind: 'text'; value: string } | { kind: 'link'; value: string };

/** Tách nội dung thành chữ và link */
export function splitChatText(content: string): ChatTextPart[] {
    const parts: ChatTextPart[] = [];
    let lastIndex = 0;

    for (const match of content.matchAll(URL_PATTERN)) {
        const rawUrl = match[0];
        const url = rawUrl.replace(TRAILING_PUNCTUATION, '');
        const start = match.index ?? 0;
        if (start > lastIndex) {
            parts.push({
                kind: 'text',
                value: content.slice(lastIndex, start),
            });
        }
        parts.push({ kind: 'link', value: url });
        lastIndex = start + url.length;
    }
    if (lastIndex < content.length) {
        parts.push({ kind: 'text', value: content.slice(lastIndex) });
    }
    return parts;
}

export interface SharedChatLink {
    url: string;
    senderUserId: string;
    createdAt: string;
}

/** Danh sách link đã gửi, mới nhất trước */
export function extractSharedLinks(
    messages: ChatMessageView[]
): SharedChatLink[] {
    const seen = new Set<string>();
    const links: SharedChatLink[] = [];

    for (const message of [...messages].reverse()) {
        if (message.status !== 'sent' || message.isDeleted) continue;
        for (const part of splitChatText(message.contentText)) {
            if (part.kind !== 'link' || seen.has(part.value)) continue;
            seen.add(part.value);
            links.push({
                url: part.value,
                senderUserId: message.senderUserId,
                createdAt: message.createdAt,
            });
        }
    }
    return links;
}

// ---------------------------------------------------------------------------
// Thông báo lỗi
// ---------------------------------------------------------------------------

const CHAT_ERROR_MESSAGES: Record<string, string> = {
    // Gateway giới hạn 5 tin / 10 giây
    RATE_LIMITED: 'Bạn gửi quá nhanh. Đợi khoảng 10 giây rồi bấm Gửi lại.',
    NOT_A_MEMBER: 'Bạn không còn là thành viên của server này.',
    INVALID_PAYLOAD: 'Tin nhắn không hợp lệ.',
    BACKEND_UNAVAILABLE: 'Máy chủ đang bận. Vui lòng thử lại.',
    TIMEOUT: 'Mất quá lâu để gửi. Kiểm tra kết nối rồi thử lại.',
    DISCONNECTED: 'Đang mất kết nối. Tin sẽ cần gửi lại.',
};

/** Lỗi upload ảnh theo mã HTTP */
export function getChatUploadErrorMessage(status: number | undefined): string {
    if (status === 400 || status === 413) {
        return 'Ảnh không hợp lệ: chỉ PNG, JPEG, WEBP, tối đa 5MB.';
    }
    return 'Không tải được ảnh lên. Bấm Gửi lại để thử lại.';
}

export function getChatErrorMessage(code: string): string {
    return CHAT_ERROR_MESSAGES[code] ?? 'Không gửi được tin nhắn.';
}

// ---------------------------------------------------------------------------
// Reply
// ---------------------------------------------------------------------------

export const RECALLED_REPLY_TEXT = 'Tin nhắn đã bị thu hồi';
export const IMAGE_ONLY_REPLY_TEXT = '[Hình ảnh]';

/** Tin có thể được trả lời: đã gửi xong và chưa thu hồi */
export function toReplyTarget(message: ChatMessageView): ChatReplyView | null {
    if (!message.messageId || message.status !== 'sent' || message.isDeleted) {
        return null;
    }
    return {
        messageId: message.messageId,
        senderUserId: message.senderUserId,
        contentText: message.contentText,
        isDeleted: false,
    };
}

/** Nội dung hiển thị trong trích dẫn */
export function getReplyPreviewText(reply: ChatReplyView): string {
    if (reply.isDeleted) return RECALLED_REPLY_TEXT;
    return reply.contentText?.trim() || IMAGE_ONLY_REPLY_TEXT;
}

/** Id của tin trong danh sách, dùng để cuộn tới tin gốc */
export function chatMessageElementId(messageId: string): string {
    return `chat-message-${messageId}`;
}

export interface ChatMessagePermissionInput {
    /** Tin của chính người đang xem */
    isOwn: boolean;
    /** Người đang xem là owner server */
    isServerOwner: boolean;
    /** Người gửi tin là owner server */
    isSenderOwner: boolean;
}

export interface ChatMessageActions {
    canEdit: boolean;
    canRecall: boolean;
}

const NO_MESSAGE_ACTIONS: ChatMessageActions = { canEdit: false, canRecall: false };

export function getMessageActions(
    message: ChatMessageView,
    { isOwn, isServerOwner, isSenderOwner }: ChatMessagePermissionInput
): ChatMessageActions {
    // Chỉ tin đã lưu trên server và chưa thu hồi mới thao tác được
    if (!message.messageId || message.status !== 'sent' || message.isDeleted) {
        return NO_MESSAGE_ACTIONS;
    }
    // Người gửi: sửa và thu hồi (kể cả khi người gửi là owner)
    if (isOwn) return { canEdit: true, canRecall: true };
    // Owner: chỉ thu hồi tin của member, không đụng tin owner khác
    if (isServerOwner && !isSenderOwner) return { canEdit: false, canRecall: true };
    return NO_MESSAGE_ACTIONS;
}

export const EDITED_MESSAGE_LABEL = 'Đã thay đổi';

/** Phần thay đổi của một tin sau khi sửa hoặc thu hồi */
export type ChatMessagePatch = Pick<
    ChatMessageView,
    'contentText' | 'editedAt' | 'isDeleted'
>;

/** Chuyển kết quả PATCH / DELETE từ BE thành phần thay đổi */
export function toMessagePatch(response: ChatMessageResponse): ChatMessagePatch {
    return {
        contentText: response.contentText ?? '',
        editedAt: response.editedAt,
        isDeleted: Boolean(response.deletedAt),
    };
}

/** Đè các thay đổi lên danh sách tin, theo messageId; cập nhật cả trích dẫn trỏ tới tin đó */
export function applyMessagePatches(
    messages: ChatMessageView[],
    patches: Record<string, ChatMessagePatch>
): ChatMessageView[] {
    if (Object.keys(patches).length === 0) return messages;
    return messages.map((message) => {
        const patch = message.messageId ? patches[message.messageId] : undefined;
        const replyPatch = message.replyTo
            ? patches[message.replyTo.messageId]
            : undefined;
        if (!patch && !replyPatch) return message;

        return {
            ...message,
            ...patch,
            // Thu hồi thì ẩn luôn ảnh
            ...(patch?.isDeleted ? { attachments: [] } : {}),
            // Tin đang trích dẫn tin vừa sửa / thu hồi thì cập nhật trích dẫn
            ...(replyPatch && message.replyTo
                ? {
                      replyTo: {
                          ...message.replyTo,
                          contentText: replyPatch.isDeleted
                              ? null
                              : replyPatch.contentText,
                          isDeleted: replyPatch.isDeleted,
                      },
                  }
                : {}),
        };
    });
}

/** Nội dung mới chỉ tính là thay đổi khi khác tin gốc (bỏ khoảng trắng hai đầu) */
export function isEditChanged(original: string, next: string): boolean {
    return next.trim() !== original.trim();
}

const EDIT_ERROR_MESSAGES: Record<number, string> = {
    400: 'Nội dung không hợp lệ.',
    403: 'Bạn không có quyền sửa tin nhắn này.',
    404: 'Tin nhắn không còn tồn tại.',
    409: 'Tin nhắn đã bị thu hồi, không thể sửa.',
};

export function getChatEditErrorMessage(status: number | undefined): string {
    return (
        (status !== undefined && EDIT_ERROR_MESSAGES[status]) ||
        'Không sửa được tin nhắn. Vui lòng thử lại.'
    );
}

export const MAX_RECALL_REASON_LENGTH = 255;

const RECALL_ERROR_MESSAGES: Record<number, string> = {
    400: 'Cần nhập lý do hợp lệ (tối đa 255 ký tự).',
    403: 'Bạn không có quyền thu hồi tin nhắn này.',
    404: 'Tin nhắn không còn tồn tại.',
};

export function getChatRecallErrorMessage(status: number | undefined): string {
    return (
        (status !== undefined && RECALL_ERROR_MESSAGES[status]) ||
        'Không thu hồi được tin nhắn. Vui lòng thử lại.'
    );
}