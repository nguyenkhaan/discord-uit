import { CornerUpLeft, X } from 'lucide-react';

import { Button } from '@/components/common/Button';
import type { ChatReplyView } from '@/features/chat/chat.type';
import { getReplyPreviewText } from '@/features/chat/chat.utils';

interface ChatReplyBarProps {
    target: ChatReplyView;
    senderName: string;
    onCancel: () => void;
}

/** Thanh "Đang trả lời" phía trên ô nhập */
export function ChatReplyBar({
    target,
    senderName,
    onCancel,
}: ChatReplyBarProps) {
    return (
        <div className="mb-2 flex items-center gap-2 rounded-lg border-l-2 border-brand bg-brand-subtle px-3 py-1.5">
            <CornerUpLeft
                aria-hidden="true"
                className="size-4 shrink-0 text-brand"
            />
            <div className="min-w-0 flex-1 text-caption">
                <p className="text-muted">
                    Đang trả lời{' '}
                    <span className="font-semibold text-heading">
                        {senderName}
                    </span>
                </p>
                <p className="truncate text-foreground-secondary">
                    {getReplyPreviewText(target)}
                </p>
            </div>
            <Button
                aria-label="Huỷ trả lời"
                className="size-7 min-h-7 shrink-0"
                onClick={onCancel}
                size="icon"
                variant="ghost"
            >
                <X aria-hidden="true" className="size-4" />
            </Button>
        </div>
    );
}
