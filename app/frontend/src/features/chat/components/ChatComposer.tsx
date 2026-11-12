import { ImagePlus, SendHorizontal } from 'lucide-react';
import {
    useEffect,
    useId,
    useRef,
    useState,
    type ChangeEvent,
    type FormEvent,
    type KeyboardEvent,
} from 'react';

import { Button } from '@/components/common/Button';
import { ChatAttachmentPreview } from '@/features/chat/components/ChatAttachmentPreview';
import { ChatEmojiPicker } from '@/features/chat/components/ChatEmojiPicker';
import { ChatReplyBar } from '@/features/chat/components/ChatReplyBar';
import { useChatAttachments } from '@/features/chat/chat.hooks';
import type { ChatReplyView } from '@/features/chat/chat.type';
import { MAX_CHAT_MESSAGE_LENGTH } from '@/features/chat/chat.utils';
import { cn } from '@/lib/utils';

const MAX_TEXTAREA_HEIGHT_PX = 160;
const COUNTER_VISIBLE_FROM = MAX_CHAT_MESSAGE_LENGTH - 200;

interface ChatComposerProps {
    serverName?: string;
    disabledReason?: string;
    onSend: (content: string) => void;
    /** Tin đang được trả lời */
    replyTarget?: ChatReplyView | null;
    replySenderName?: string;
    onCancelReply?: () => void;
}

export function ChatComposer({
    serverName,
    disabledReason,
    onSend,
    replyTarget,
    replySenderName,
    onCancelReply,
}: ChatComposerProps) {
    const inputId = useId();
    const hintId = useId();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [content, setContent] = useState('');
    const {
        attachments,
        error: attachmentError,
        addFiles,
        removeAttachment,
        clearAttachments,
    } = useChatAttachments();

    const isDisabled = Boolean(disabledReason);
    const length = content.trim().length;
    const isTooLong = length > MAX_CHAT_MESSAGE_LENGTH;
    const canSend = !isDisabled && length > 0 && !isTooLong;

    // Chọn trả lời thì đưa con trỏ vào ô nhập
    const replyTargetId = replyTarget?.messageId;
    useEffect(() => {
        if (replyTargetId) textareaRef.current?.focus();
    }, [replyTargetId]);

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
        // Chưa có API upload: chỉ gửi chữ, bỏ ảnh đã chọn
        clearAttachments();
        textareaRef.current?.focus();
    }

    function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
        addFiles(Array.from(event.target.files ?? []));
        // Cho phép chọn lại cùng một file
        event.target.value = '';
    }

    // Chèn emoji tại vị trí con trỏ
    function insertEmoji(emoji: string) {
        const textarea = textareaRef.current;
        const start = textarea?.selectionStart ?? content.length;
        const end = textarea?.selectionEnd ?? content.length;
        setContent(content.slice(0, start) + emoji + content.slice(end));
        requestAnimationFrame(() => {
            if (!textarea) return;
            const cursor = start + emoji.length;
            textarea.focus();
            textarea.setSelectionRange(cursor, cursor);
        });
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        submit();
    }

    function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
        // Esc để huỷ trả lời
        if (event.key === 'Escape' && replyTarget && onCancelReply) {
            event.preventDefault();
            onCancelReply();
            return;
        }
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
            {replyTarget && onCancelReply && (
                <ChatReplyBar
                    onCancel={onCancelReply}
                    senderName={replySenderName ?? 'Thành viên'}
                    target={replyTarget}
                />
            )}
            <ChatAttachmentPreview
                attachments={attachments}
                onRemove={removeAttachment}
            />
            {attachmentError && (
                <p
                    className="mb-2 text-caption text-feedback-danger"
                    role="alert"
                >
                    {attachmentError}
                </p>
            )}
            <input
                accept="image/*"
                className="hidden"
                multiple
                onChange={handleFileChange}
                ref={fileInputRef}
                type="file"
            />
            <div
                className={cn(
                    'flex items-end gap-2 rounded-xl border border-line bg-surface-subtle px-3 py-2 transition-colors focus-within:border-brand focus-within:ring-3 focus-within:ring-focus/20',
                    isDisabled && 'opacity-70'
                )}
            >
                <Button
                    aria-label="Đính kèm ảnh"
                    className="size-9 min-h-9 shrink-0 rounded-lg"
                    disabled={isDisabled}
                    onClick={() => fileInputRef.current?.click()}
                    size="icon"
                    variant="ghost"
                >
                    <ImagePlus aria-hidden="true" className="size-5" />
                </Button>
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
                <ChatEmojiPicker disabled={isDisabled} onSelect={insertEmoji} />
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
