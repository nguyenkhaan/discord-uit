import { ChatComposer } from '@/features/chat/components/ChatComposer';
import { ChatConnectionBanner } from '@/features/chat/components/ChatConnectionBanner';
import { ChatMessageList } from '@/features/chat/components/ChatMessageList';
import type { ServerChat } from '@/features/chat/chat.hooks';

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
    const disabledReason =
        lockedReason ?? (chat.isReady ? undefined : CONNECTION_DISABLED_REASON);

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
                onRetry={chat.retryMessage}
            />
            <ChatComposer
                disabledReason={disabledReason}
                onSend={chat.sendMessage}
                serverName={serverName}
            />
        </section>
    );
}
