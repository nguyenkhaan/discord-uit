import { CircleAlert, RotateCw } from 'lucide-react';

import { Button } from '@/components/common/Button';
import { UserAvatar } from '@/components/common/UserAvatar';
import { chatBubbleVariants } from '@/features/chat/components/chatBubbleVariants';
import { ChatMessageContent } from '@/features/chat/components/ChatMessageContent';
import type { ChatMessageView } from '@/features/chat/chat.type';
import {
    DELETED_MESSAGE_TEXT,
    formatChatTime,
} from '@/features/chat/chat.utils';
import { cn } from '@/lib/utils';

interface ChatMessageItemProps {
    message: ChatMessageView;
    senderName: string;
    isOwn: boolean;
    isGroupStart: boolean;
    onRetry: (clientRequestId: string) => void;
}

/** Một tin nhắn: của mình bên phải, người khác bên trái */
export function ChatMessageItem({
    message,
    senderName,
    isOwn,
    isGroupStart,
    onRetry,
}: ChatMessageItemProps) {
    const time = formatChatTime(message.createdAt);
    const bubbleTone = message.isDeleted ? 'deleted' : isOwn ? 'own' : 'other';

    return (
        <article
            aria-label={`${isOwn ? 'Bạn' : senderName}, ${time}`}
            className={cn(
                'flex gap-2',
                isOwn ? 'justify-end' : 'justify-start',
                isGroupStart ? 'mt-3' : 'mt-0.5'
            )}
        >
            {!isOwn && (
                <div className="w-8 shrink-0">
                    {isGroupStart && <UserAvatar name={senderName} size="sm" />}
                </div>
            )}

            <div
                className={cn(
                    'flex min-w-0 max-w-[80%] flex-col sm:max-w-[70%]',
                    isOwn ? 'items-end' : 'items-start'
                )}
            >
                {isGroupStart && (
                    <p className="mb-1 flex items-baseline gap-2 px-1 text-caption text-muted">
                        {!isOwn && (
                            <span className="truncate font-semibold text-foreground-secondary">
                                {senderName}
                            </span>
                        )}
                        <time dateTime={message.createdAt}>{time}</time>
                    </p>
                )}

                <div
                    className={cn(
                        chatBubbleVariants({ tone: bubbleTone }),
                        message.status === 'sending' && 'opacity-60'
                    )}
                    title={time}
                >
                    {message.isDeleted ? (
                        DELETED_MESSAGE_TEXT
                    ) : (
                        <ChatMessageContent
                            content={message.contentText}
                            tone={isOwn ? 'onBrand' : 'default'}
                        />
                    )}
                </div>

                {message.status === 'sending' && (
                    <p className="mt-0.5 px-1 text-caption text-muted">
                        Đang gửi...
                    </p>
                )}

                {message.status === 'failed' && message.clientRequestId && (
                    <div
                        className="mt-0.5 flex flex-wrap items-center gap-x-2 text-caption text-feedback-danger"
                        role="alert"
                    >
                        <CircleAlert aria-hidden="true" className="size-3.5" />
                        <span>{message.errorMessage ?? 'Không gửi được.'}</span>
                        <Button
                            className="min-h-7 px-2 text-caption"
                            onClick={() =>
                                message.clientRequestId &&
                                onRetry(message.clientRequestId)
                            }
                            size="compact"
                            variant="ghost"
                        >
                            <RotateCw aria-hidden="true" className="size-3.5" />
                            Gửi lại
                        </Button>
                    </div>
                )}
            </div>
        </article>
    );
}
