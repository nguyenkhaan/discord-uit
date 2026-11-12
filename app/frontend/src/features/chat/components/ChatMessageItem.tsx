import { CircleAlert, CornerUpLeft, RotateCw } from 'lucide-react';

import { Button } from '@/components/common/Button';
import { UserAvatar } from '@/components/common/UserAvatar';
import { chatBubbleVariants } from '@/features/chat/components/chatBubbleVariants';
import { ChatMessageAttachments } from '@/features/chat/components/ChatMessageAttachments';
import { ChatMessageContent } from '@/features/chat/components/ChatMessageContent';
import { ChatReplyQuote } from '@/features/chat/components/ChatReplyQuote';
import type { ChatMessageView } from '@/features/chat/chat.type';
import {
    chatMessageElementId,
    DELETED_MESSAGE_TEXT,
    formatChatTime,
    toReplyTarget,
} from '@/features/chat/chat.utils';
import { cn } from '@/lib/utils';

interface ChatMessageItemProps {
    message: ChatMessageView;
    senderName: string;
    isOwn: boolean;
    isGroupStart: boolean;
    onRetry: (clientRequestId: string) => void;
    onReply: (message: ChatMessageView) => void;
    /** Tên người viết tin được trả lời */
    replySenderName?: string;
}

/** Một tin nhắn: của mình bên phải, người khác bên trái */
export function ChatMessageItem({
    message,
    senderName,
    isOwn,
    isGroupStart,
    onRetry,
    onReply,
    replySenderName,
}: ChatMessageItemProps) {
    const time = formatChatTime(message.createdAt);
    const bubbleTone = message.isDeleted ? 'deleted' : isOwn ? 'own' : 'other';
    const canReply = toReplyTarget(message) !== null;
    const attachments = message.isDeleted ? [] : (message.attachments ?? []);
    // Tin chỉ có ảnh thì không hiện bong bóng chữ rỗng
    const hasBubble = message.isDeleted || message.contentText.trim() !== '';

    return (
        <article
            aria-label={`${isOwn ? 'Bạn' : senderName}, ${time}`}
            id={
                message.messageId
                    ? chatMessageElementId(message.messageId)
                    : undefined
            }
            tabIndex={-1}
            className={cn(
                'group flex scroll-mt-4 gap-2 rounded-xl outline-none transition-colors focus:bg-brand-subtle/60',
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

                {message.replyTo && (
                    <ChatReplyQuote
                        isOwn={isOwn}
                        reply={message.replyTo}
                        senderName={replySenderName ?? 'Thành viên'}
                    />
                )}

                <div
                    className={cn(
                        'flex max-w-full items-center gap-1',
                        isOwn && 'flex-row-reverse'
                    )}
                >
                    <div
                        className={cn(
                            'flex min-w-0 flex-col gap-1',
                            isOwn ? 'items-end' : 'items-start',
                            message.status === 'sending' && 'opacity-60'
                        )}
                        title={time}
                    >
                        {attachments.length > 0 && (
                            <ChatMessageAttachments
                                attachments={attachments}
                                isLinkable={message.status === 'sent'}
                            />
                        )}
                        {hasBubble && (
                            <div
                                className={chatBubbleVariants({
                                    tone: bubbleTone,
                                })}
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
                        )}
                    </div>

                    {canReply && (
                        <Button
                            aria-label={`Trả lời tin của ${isOwn ? 'bạn' : senderName}`}
                            className="size-8 min-h-8 shrink-0 opacity-100 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                            onClick={() => onReply(message)}
                            size="icon"
                            title="Trả lời"
                            variant="ghost"
                        >
                            <CornerUpLeft
                                aria-hidden="true"
                                className="size-4"
                            />
                        </Button>
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
