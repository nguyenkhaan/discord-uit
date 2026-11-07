import { SendHorizontal } from 'lucide-react';
import {
    useEffect,
    useId,
    useRef,
    useState,
    type FormEvent,
    type KeyboardEvent,
} from 'react';

import { Button } from '@/components/common/Button';
import { MAX_CHAT_MESSAGE_LENGTH } from '@/features/chat/chat.utils';
import { cn } from '@/lib/utils';

const MAX_TEXTAREA_HEIGHT_PX = 160;
const COUNTER_VISIBLE_FROM = MAX_CHAT_MESSAGE_LENGTH - 200;

interface ChatComposerProps {
    serverName?: string;
    disabledReason?: string;
    onSend: (content: string) => void;
}

export function ChatComposer({
    serverName,
    disabledReason,
    onSend,
}: ChatComposerProps) {
    const inputId = useId();
    const hintId = useId();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [content, setContent] = useState('');

    const isDisabled = Boolean(disabledReason);
    const length = content.trim().length;
    const isTooLong = length > MAX_CHAT_MESSAGE_LENGTH;
    const canSend = !isDisabled && length > 0 && !isTooLong;

    // Tự tăng chiều cao ô nhập
    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT_PX)}px`;
    }, [content]);

    function submit() {
        if (!canSend) return;
        onSend(content);
        setContent('');
        textareaRef.current?.focus();
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        submit();
    }

    function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
        // Enter để gửi, bỏ qua khi bộ gõ tiếng Việt đang ghép dấu
        if (
            event.key === 'Enter' &&
            !event.shiftKey &&
            !event.nativeEvent.isComposing
        ) {
            event.preventDefault();
            submit();
        }
    }

    return (
        <form
            className="border-t border-line-subtle bg-surface px-3 py-3 sm:px-4"
            onSubmit={handleSubmit}
        >
            <label className="sr-only" htmlFor={inputId}>
                Nhập tin nhắn
            </label>
            <div
                className={cn(
                    'flex items-end gap-2 rounded-xl border border-line bg-surface-subtle px-3 py-2 transition-colors focus-within:border-brand focus-within:ring-3 focus-within:ring-focus/20',
                    isDisabled && 'opacity-70'
                )}
            >
                <textarea
                    aria-describedby={hintId}
                    className="max-h-40 min-h-6 flex-1 resize-none bg-transparent py-1.5 text-body text-foreground outline-none placeholder:text-placeholder disabled:cursor-not-allowed"
                    disabled={isDisabled}
                    id={inputId}
                    onChange={(event) => setContent(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                        disabledReason ??
                        `Nhắn tin tới ${serverName || 'server'}`
                    }
                    ref={textareaRef}
                    rows={1}
                    value={content}
                />
                <Button
                    aria-label="Gửi tin nhắn"
                    className="size-9 min-h-9 shrink-0 rounded-lg"
                    disabled={!canSend}
                    size="icon"
                    type="submit"
                >
                    <SendHorizontal aria-hidden="true" className="size-4" />
                </Button>
            </div>
            <div
                className="mt-1 flex justify-between gap-3 text-caption text-muted"
                id={hintId}
            >
                <span className="hidden sm:inline">
                    Enter để gửi · Shift + Enter để xuống dòng
                </span>
                {length >= COUNTER_VISIBLE_FROM && (
                    <span
                        className={cn(
                            'ml-auto',
                            isTooLong && 'font-semibold text-feedback-danger'
                        )}
                    >
                        {length}/{MAX_CHAT_MESSAGE_LENGTH}
                    </span>
                )}
            </div>
        </form>
    );
}
