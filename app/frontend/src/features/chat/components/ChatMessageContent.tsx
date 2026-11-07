import { splitChatText } from '@/features/chat/chat.utils';

interface ChatMessageContentProps {
    content: string;
}

/** Hiển thị nội dung tin nhắn, link bấm được */
export function ChatMessageContent({ content }: ChatMessageContentProps) {
    return (
        <p className="whitespace-pre-wrap break-words text-body text-foreground">
            {splitChatText(content).map((part, index) =>
                part.kind === 'link' ? (
                    <a
                        className="text-brand underline underline-offset-2 hover:text-brand-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
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
