import { useState } from 'react';

import { ChatComposer } from '@/features/chat/components/ChatComposer';
import { ChatConnectionBanner } from '@/features/chat/components/ChatConnectionBanner';
import { ChatMessageList } from '@/features/chat/components/ChatMessageList';
import { ChatRecallDialog } from '@/features/chat/components/ChatRecallDialog'; // MỚI
import type { ServerChat } from '@/features/chat/chat.hooks';
import type {
    ChatAttachmentDraft,
    ChatMessageView,
    ChatReplyView,
} from '@/features/chat/chat.type';
import { toReplyTarget } from '@/features/chat/chat.utils';

interface ChatPanelProps {
    chat: ServerChat;
    serverName?: string;
    currentUserId?: string;
    getSenderName: (userId: string) => string;
    /** Lý do khóa ô nhập */
    lockedReason?: string;
    /** Người đang xem là owner server */
    isServerOwner: boolean;
    /** Kiểm tra một user có phải owner server không */
    isOwnerUser: (userId: string) => boolean;
}

const CONNECTION_DISABLED_REASON = 'Đang chờ kết nối tới phòng chat...';

export function ChatPanel({
    chat,
    serverName,
    currentUserId,
    getSenderName,
    lockedReason,
    isServerOwner,
    isOwnerUser,
}: ChatPanelProps) {
    const [replyTarget, setReplyTarget] = useState<ChatReplyView | null>(null);
    // Trạng thái sửa tin
    const [editingMessage, setEditingMessage] =
        useState<ChatMessageView | null>(null);
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [editError, setEditError] = useState<string>();
    // Trạng thái thu hồi
    const [recallingMessage, setRecallingMessage] =
        useState<ChatMessageView | null>(null);
    const [isRecalling, setIsRecalling] = useState(false);
    const [recallError, setRecallError] = useState<string>();
    const disabledReason =
        lockedReason ?? (chat.isReady ? undefined : CONNECTION_DISABLED_REASON);

    function cancelEdit() {
        setEditingMessage(null);
        setEditError(undefined);
    }

    function handleReply(message: ChatMessageView) {
        cancelEdit(); // đang sửa mà bấm trả lời thì bỏ sửa
        setReplyTarget(toReplyTarget(message));
    }

    function handleEdit(message: ChatMessageView) {
        setReplyTarget(null); // đang trả lời mà bấm sửa thì bỏ trả lời
        setEditError(undefined);
        setEditingMessage(message);
    }

    async function handleSubmitEdit(content: string) {
        const messageId = editingMessage?.messageId;
        if (!messageId) return;
        setIsSavingEdit(true);
        setEditError(undefined);
        try {
            await chat.editMessage(messageId, content);
            setEditingMessage(null);
        } catch (error) {
            setEditError(
                error instanceof Error
                    ? error.message
                    : 'Không sửa được tin nhắn.'
            );
        } finally {
            setIsSavingEdit(false);
        }
    }

    function handleRecall(message: ChatMessageView) {
        setRecallError(undefined);
        setRecallingMessage(message);
    }

    function closeRecall() {
        if (isRecalling) return;
        setRecallingMessage(null);
        setRecallError(undefined);
    }

    async function handleConfirmRecall(reason?: string) {
        const messageId = recallingMessage?.messageId;
        if (!messageId) return;
        setIsRecalling(true);
        setRecallError(undefined);
        try {
            await chat.recallMessage(messageId, reason);
            // Đang sửa đúng tin này thì thoát chế độ sửa
            if (editingMessage?.messageId === messageId) cancelEdit();
            // Đang trả lời đúng tin này thì bỏ trả lời (không trả lời tin đã thu hồi được)
            setReplyTarget((current) =>
                current?.messageId === messageId ? null : current
            );
            setRecallingMessage(null);
        } catch (error) {
            setRecallError(
                error instanceof Error
                    ? error.message
                    : 'Không thu hồi được tin nhắn.'
            );
        } finally {
            setIsRecalling(false);
        }
    }

    // Gửi kèm tin đang trả lời và ảnh, rồi bỏ chọn
    function handleSend(content: string, attachments: ChatAttachmentDraft[]) {
        chat.sendMessage(content, replyTarget ?? undefined, attachments);
        setReplyTarget(null);
    }

    return (
        <section
            aria-label="Khung chat"
            className="flex min-h-0 min-w-0 flex-1 flex-col bg-surface"
        >
            <ChatConnectionBanner
                onReconnect={chat.reconnect}
                status={chat.connectionStatus}
            />
            <ChatMessageList
                currentUserId={currentUserId}
                getSenderName={getSenderName}
                history={chat.history}
                isOwnerUser={isOwnerUser}
                isServerOwner={isServerOwner}
                messages={chat.messages}
                onEdit={handleEdit}
                onRecall={handleRecall}
                onReply={handleReply}
                onRetry={chat.retryMessage}
            />
            <ChatComposer
                disabledReason={disabledReason}
                editError={editError}
                editTarget={editingMessage}
                isSavingEdit={isSavingEdit}
                onCancelEdit={cancelEdit}
                onCancelReply={() => setReplyTarget(null)}
                onSend={handleSend}
                onSubmitEdit={(content) => void handleSubmitEdit(content)}
                replySenderName={
                    replyTarget
                        ? getSenderName(replyTarget.senderUserId)
                        : undefined
                }
                replyTarget={replyTarget}
                serverName={serverName}
            />
            {/*Hộp thoại thu hồi */}
            {recallingMessage && (
                <ChatRecallDialog
                    error={recallError}
                    isPending={isRecalling}
                    message={recallingMessage}
                    onClose={closeRecall}
                    onConfirm={(reason) => void handleConfirmRecall(reason)}
                    requiresReason={
                        recallingMessage.senderUserId !== currentUserId
                    }
                    senderName={getSenderName(recallingMessage.senderUserId)}
                />
            )}
        </section>
    );
}