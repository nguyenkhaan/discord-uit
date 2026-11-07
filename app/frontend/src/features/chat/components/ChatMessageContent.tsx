import { splitChatText } from '@/features/chat/chat.utils';
import { cn } from '@/lib/utils';

interface ChatMessageContentProps {
    content: string;
    /** Màu link: `onBrand` khi nằm trên nền xanh */
    tone?: 'default' | 'onBrand';
}

/** Hiển thị nội dung tin nhắn, link bấm được */
export function ChatMessageContent({
    content,
    tone = 'default',
}: ChatMessageContentProps) {
    return (
        <p className="whitespace-pre-wrap break-words">
            {splitChatText(content).map((part, index) =>
                part.kind === 'link' ? (
                    <a
                        className={cn(
                            'underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus',
                            tone === 'onBrand'
                                ? 'text-on-brand decoration-on-brand/70 hover:decoration-on-brand'
                                : 'text-brand hover:text-brand-active'
                        )}
                        href={part.value}
                        key={index}
                        rel="noopener noreferrer"
                        target="_blank"
                    >
                        {part.value}
                    </a>
                ) : (
                    <span key={index}>{part.value}</span>
                )
            )}
        </p>
    );
}
