import { CircleAlert, CornerUpLeft, Pencil, RotateCw, Undo2 } from 'lucide-react';

import { Button } from '@/components/common/Button';
import { UserAvatar } from '@/components/common/UserAvatar';
import { chatBubbleVariants } from '@/features/chat/components/chatBubbleVariants';
import { ChatMessageAttachments } from '@/features/chat/components/ChatMessageAttachments';
import { ChatMessageContent } from '@/features/chat/components/ChatMessageContent';
import { ChatReactionBar } from '@/features/chat/components/ChatReactionBar';
import { ChatReactionPicker } from '@/features/chat/components/ChatReactionPicker';
import { ChatReplyQuote } from '@/features/chat/components/ChatReplyQuote';
import { useChatReactions } from '@/features/chat/chat.hooks';
import type { ChatMessageView } from '@/features/chat/chat.type';
import {
    chatMessageElementId,
    DELETED_MESSAGE_TEXT,
    EDITED_MESSAGE_LABEL,
    formatChatTime,
    toReplyTarget,
} from '@/features/chat/chat.utils';
import { DropdownMenu, type DropdownMenuItem } from '@/components/common/DropdownMenu';
import type { ChatMessageActions } from '@/features/chat/chat.utils';
import { cn } from '@/lib/utils';

interface ChatMessageItemProps {
    serverId: string;
    message: ChatMessageView;
    senderName: string;
    isOwn: boolean;
    isGroupStart: boolean;
    onRetry: (clientRequestId: string) => void;
    onReply: (message: ChatMessageView) => void;
    /** Tên người viết tin được trả lời */
    replySenderName?: string;
    actions: ChatMessageActions;
    onEdit: (message: ChatMessageView) => void;
    onRecall: (message: ChatMessageView) => void;
}

/** Một tin nhắn: của mình bên phải, người khác bên trái */
export function ChatMessageItem({
    serverId,
    message,
    senderName,
    isOwn,
    isGroupStart,
    onRetry,
    onReply,
    replySenderName,
    actions,
    onEdit,
    onRecall
}: ChatMessageItemProps) {
    const time = formatChatTime(message.createdAt);
    const bubbleTone = message.isDeleted ? 'deleted' : isOwn ? 'own' : 'other';
    const canReply = toReplyTarget(message) !== null;
    // Chỉ tin đã gửi xong và chưa thu hồi mới có reaction
    const reactions = useChatReactions(serverId, message.messageId, canReply);
    const menuItems: DropdownMenuItem[] = [
    ...(actions.canEdit
        ? [{ key: 'edit', label: 'Sửa', icon: Pencil, onSelect: () => onEdit(message) }]
        : []),
    ...(actions.canRecall
        ? [{
              key: 'recall',
              label: 'Thu hồi',
              icon: Undo2,
              tone: 'danger' as const,
              onSelect: () => onRecall(message),
          }]
        : []),
];
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

                {message.editedAt && !message.isDeleted && (
                    <p
                        className="mb-0.5 px-1 text-caption text-info-accent"
                        title={`Đã sửa lúc ${formatChatTime(message.editedAt)}`}
                    >
                        {EDITED_MESSAGE_LABEL}
                    </p>
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
                        <ChatReactionPicker
                            align={isOwn ? 'right' : 'left'}
                            disabled={reactions.isPending}
                            myIconId={reactions.myIconId}
                            onSelect={reactions.react}
                        />
                    )}

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
                    {menuItems.length > 0 && (
                        <DropdownMenu
                            className="shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100"
                            items={menuItems}
                            label={`Tuỳ chọn tin của ${isOwn ? 'bạn' : senderName}`}
                        />
                    )}
                </div>

                {canReply && (
                    <ChatReactionBar
                        disabled={reactions.isPending}
                        onToggle={reactions.react}
                        reactions={reactions.reactions}
                    />
                )}

                {reactions.isError && (
                    <p
                        className="mt-0.5 px-1 text-caption text-feedback-danger"
                        role="alert"
                    >
                        Không thả được cảm xúc. Vui lòng thử lại.
                    </p>
                )}

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
