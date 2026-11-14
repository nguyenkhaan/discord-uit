import { CornerUpLeft } from 'lucide-react';

import type { ChatReplyView } from '@/features/chat/chat.type';
import {
    chatMessageElementId,
    getReplyPreviewText,
} from '@/features/chat/chat.utils';
import { cn } from '@/lib/utils';

interface ChatReplyQuoteProps {
    reply: ChatReplyView;
    senderName: string;
    isOwn: boolean;
}

/** Khối trích dẫn tin được trả lời, bấm để cuộn tới tin gốc */
export function ChatReplyQuote({
    reply,
    senderName,
    isOwn,
}: ChatReplyQuoteProps) {
    function scrollToOriginal() {
        const element = document.getElementById(
            chatMessageElementId(reply.messageId)
        );
        if (!element) return;
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus({ preventScroll: true });
    }

    return (
        <button
            className={cn(
                'mb-1 flex max-w-full cursor-pointer flex-col rounded-lg border-l-2 border-line-brand bg-surface-subtle px-2.5 py-1 text-left text-caption transition-colors hover:bg-brand-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus',
                isOwn ? 'items-end self-end' : 'items-start self-start'
            )}
            onClick={scrollToOriginal}
            title="Xem tin gốc"
            type="button"
        >
            <span className="inline-flex items-center gap-1 font-semibold text-muted">
                <CornerUpLeft aria-hidden="true" className="size-3" />
                Trả lời {senderName}
            </span>
            <span
                className={cn(
                    'line-clamp-2 break-words text-foreground-secondary',
                    reply.isDeleted && 'italic text-muted'
                )}
            >
                {getReplyPreviewText(reply)}
            </span>
        </button>
    );
}
