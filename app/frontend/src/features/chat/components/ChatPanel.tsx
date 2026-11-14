import { useState } from 'react';

import { ChatComposer } from '@/features/chat/components/ChatComposer';
import { ChatConnectionBanner } from '@/features/chat/components/ChatConnectionBanner';
import { ChatMessageList } from '@/features/chat/components/ChatMessageList';
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
}

const CONNECTION_DISABLED_REASON = 'Đang chờ kết nối tới phòng chat...';

export function ChatPanel({
    chat,
    serverName,
    currentUserId,
    getSenderName,
    lockedReason,
}: ChatPanelProps) {
    const [replyTarget, setReplyTarget] = useState<ChatReplyView | null>(null);
    const disabledReason =
        lockedReason ?? (chat.isReady ? undefined : CONNECTION_DISABLED_REASON);

    function handleReply(message: ChatMessageView) {
        setReplyTarget(toReplyTarget(message));
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
                messages={chat.messages}
                onReply={handleReply}
                onRetry={chat.retryMessage}
            />
            <ChatComposer
                disabledReason={disabledReason}
                onCancelReply={() => setReplyTarget(null)}
                onSend={handleSend}
                replySenderName={
                    replyTarget
                        ? getSenderName(replyTarget.senderUserId)
                        : undefined
                }
                replyTarget={replyTarget}
                serverName={serverName}
            />
        </section>
    );
}
