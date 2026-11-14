import { LoaderCircle, MessagesSquare } from 'lucide-react';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';

import { Button } from '@/components/common/Button';
import { ChatDayDivider } from '@/features/chat/components/ChatDayDivider';
import { ChatMessageItem } from '@/features/chat/components/ChatMessageItem';
import type { ServerChat } from '@/features/chat/chat.hooks';
import type { ChatMessageView } from '@/features/chat/chat.type';
import { buildChatTimeline } from '@/features/chat/chat.utils';

/** Khoảng cách tới đáy để tự cuộn */
const STICK_TO_BOTTOM_PX = 120;

interface ChatMessageListProps {
    messages: ChatMessageView[];
    history: ServerChat['history'];
    currentUserId?: string;
    getSenderName: (userId: string) => string;
    onRetry: (clientRequestId: string) => void;
    onReply: (message: ChatMessageView) => void;
}

export function ChatMessageList({
    messages,
    history,
    currentUserId,
    getSenderName,
    onRetry,
    onReply,
}: ChatMessageListProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const topSentinelRef = useRef<HTMLDivElement>(null);
    const isNearBottomRef = useRef(true);
    const firstKeyRef = useRef<string | undefined>(undefined);
    const scrollHeightRef = useRef(0);
    const timeline = useMemo(() => buildChatTimeline(messages), [messages]);
    const firstKey = messages[0]?.key;
    const lastMessage = messages.at(-1);
    const { hasOlder, isLoadingOlder, loadOlder } = history;

    function handleScroll() {
        const element = containerRef.current;
        if (!element) return;
        isNearBottomRef.current =
            element.scrollHeight - element.scrollTop - element.clientHeight <
            STICK_TO_BOTTOM_PX;
    }

    // Giữ vị trí cuộn khi tải tin cũ
    useLayoutEffect(() => {
        const element = containerRef.current;
        if (!element) return;
        const isPrepend =
            firstKeyRef.current !== undefined &&
            firstKeyRef.current !== firstKey;
        if (isPrepend && !isNearBottomRef.current) {
            element.scrollTop += element.scrollHeight - scrollHeightRef.current;
        }
        firstKeyRef.current = firstKey;
        scrollHeightRef.current = element.scrollHeight;
    }, [firstKey, messages]);

    // Tự cuộn xuống khi có tin mới
    useLayoutEffect(() => {
        const element = containerRef.current;
        if (!element || !lastMessage) return;
        const isOwnNewMessage =
            lastMessage.senderUserId === currentUserId &&
            lastMessage.status === 'sending';
        if (isNearBottomRef.current || isOwnNewMessage) {
            element.scrollTop = element.scrollHeight;
            scrollHeightRef.current = element.scrollHeight;
        }
    }, [lastMessage, currentUserId]);

    // Cuộn lên đầu thì tải tin cũ
    useEffect(() => {
        const root = containerRef.current;
        const sentinel = topSentinelRef.current;
        if (!root || !sentinel || !hasOlder) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry?.isIntersecting) loadOlder();
            },
            { root, rootMargin: '200px 0px 0px 0px' }
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasOlder, loadOlder]);

    if (history.isLoading) {
        return (
            <div
                aria-busy="true"
                aria-label="Đang tải tin nhắn"
                className="flex min-h-0 flex-1 flex-col justify-end gap-4 px-4 py-4"
            >
                {[0, 1, 2].map((key) => (
                    <div className="flex animate-pulse gap-3" key={key}>
                        <span className="size-10 rounded-full bg-surface-subtle" />
                        <div className="flex-1 space-y-2">
                            <span className="block h-3 w-32 rounded bg-surface-subtle" />
                            <span className="block h-3 w-3/4 rounded bg-surface-subtle" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div
            aria-label="Tin nhắn"
            aria-live="polite"
            className="min-h-0 flex-1 overflow-y-auto px-2 py-3 sm:px-4"
            onScroll={handleScroll}
            ref={containerRef}
            role="log"
        >
            {history.isError && (
                <div className="mb-3 flex items-center justify-between gap-3 rounded-xl bg-danger-subtle px-3 py-2 text-body-sm text-feedback-danger">
                    <span>Không tải được tin nhắn cũ.</span>
                    <Button
                        onClick={history.retry}
                        size="compact"
                        variant="ghost"
                    >
                        Thử lại
                    </Button>
                </div>
            )}

            {hasOlder && (
                <div className="flex justify-center py-2" ref={topSentinelRef}>
                    <Button
                        disabled={isLoadingOlder}
                        onClick={loadOlder}
                        size="compact"
                        variant="ghost"
                    >
                        {isLoadingOlder && (
                            <LoaderCircle
                                aria-hidden="true"
                                className="size-4 animate-spin"
                            />
                        )}
                        {isLoadingOlder ? 'Đang tải...' : 'Tải tin nhắn cũ hơn'}
                    </Button>
                </div>
            )}

            {!hasOlder && messages.length > 0 && !history.isError && (
                <p className="py-3 text-center text-caption text-muted">
                    Đây là đầu cuộc trò chuyện.
                </p>
            )}

            {messages.length === 0 && !history.isError ? (
                <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                    <span className="grid size-14 place-items-center rounded-2xl bg-brand-subtle text-brand">
                        <MessagesSquare aria-hidden="true" className="size-7" />
                    </span>
                    <p className="mt-3 font-semibold text-heading">
                        Chưa có tin nhắn nào
                    </p>
                    <p className="mt-1 max-w-sm text-body-sm text-muted">
                        Gửi lời chào để bắt đầu cuộc trò chuyện với mọi người
                        trong server.
                    </p>
                </div>
            ) : (
                timeline.map((item) =>
                    item.kind === 'day' ? (
                        <ChatDayDivider key={item.key} label={item.label} />
                    ) : (
                        <ChatMessageItem
                            isGroupStart={item.isGroupStart}
                            isOwn={item.message.senderUserId === currentUserId}
                            key={item.key}
                            message={item.message}
                            onReply={onReply}
                            onRetry={onRetry}
                            replySenderName={
                                item.message.replyTo &&
                                getSenderName(item.message.replyTo.senderUserId)
                            }
                            senderName={getSenderName(
                                item.message.senderUserId
                            )}
                        />
                    )
                )
            )}
        </div>
    );
}
