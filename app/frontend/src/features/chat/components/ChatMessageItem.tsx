import { CircleAlert, RotateCw } from 'lucide-react';

import { Button } from '@/components/common/Button';
import { UserAvatar } from '@/components/common/UserAvatar';
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

export function ChatMessageItem({
    message,
    senderName,
    isOwn,
    isGroupStart,
    onRetry,
}: ChatMessageItemProps) {
    const time = formatChatTime(message.createdAt);

    return (
        <article
            aria-label={`${senderName}, ${time}`}
            className={cn(
                'group flex gap-3 rounded-lg px-2 py-0.5 hover:bg-surface-subtle',
                isGroupStart && 'mt-3 pt-1.5'
            )}
        >
            <div className="w-10 shrink-0">
                {isGroupStart ? (
                    <UserAvatar
                        name={senderName}
                        tone={isOwn ? 'brand' : 'subtle'}
                    />
                ) : (
                    <time
                        className="block pt-1 text-right text-[0.6875rem] text-subtle opacity-0 group-hover:opacity-100"
                        dateTime={message.createdAt}
                    >
                        {time}
                    </time>
                )}
            </div>

            <div className="min-w-0 flex-1">
                {isGroupStart && (
                    <p className="flex items-baseline gap-2">
                        <span className="truncate text-sm font-bold text-heading">
                            {isOwn ? `${senderName} (Bạn)` : senderName}
                        </span>
                        <time
                            className="shrink-0 text-caption text-muted"
                            dateTime={message.createdAt}
                        >
                            {time}
                        </time>
                    </p>
                )}

                {message.isDeleted ? (
                    <p className="text-body italic text-muted">
                        {DELETED_MESSAGE_TEXT}
                    </p>
                ) : (
                    <div
                        className={cn(
                            message.status === 'sending' && 'opacity-60'
                        )}
                    >
                        <ChatMessageContent content={message.contentText} />
                    </div>
                )}

                {message.status === 'sending' && (
                    <p className="text-caption text-muted">Đang gửi...</p>
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
