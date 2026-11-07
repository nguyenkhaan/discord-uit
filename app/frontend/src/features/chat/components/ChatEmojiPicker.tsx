import { Smile } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import { Button } from '@/components/common/Button';
import { CHAT_EMOJIS } from '@/features/chat/chat.emoji';

interface ChatEmojiPickerProps {
    disabled?: boolean;
    onSelect: (emoji: string) => void;
}

/** Nút mở bảng emoji, bấm emoji để chèn vào ô nhập */
export function ChatEmojiPicker({ disabled, onSelect }: ChatEmojiPickerProps) {
    const panelId = useId();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    // Đóng khi bấm ra ngoài hoặc nhấn Esc
    useEffect(() => {
        if (!isOpen) return;

        function closeOnOutsideClick(event: MouseEvent) {
            if (!containerRef.current?.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        function closeOnEscape(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setIsOpen(false);
                triggerRef.current?.focus();
            }
        }
        document.addEventListener('mousedown', closeOnOutsideClick);
        document.addEventListener('keydown', closeOnEscape);
        return () => {
            document.removeEventListener('mousedown', closeOnOutsideClick);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [isOpen]);

    return (
        <div className="relative" ref={containerRef}>
            <Button
                aria-controls={isOpen ? panelId : undefined}
                aria-expanded={isOpen}
                aria-label="Chọn emoji"
                className="size-9 min-h-9 shrink-0 rounded-lg"
                disabled={disabled}
                onClick={() => setIsOpen((open) => !open)}
                ref={triggerRef}
                size="icon"
                variant="ghost"
            >
                <Smile aria-hidden="true" className="size-5" />
            </Button>

            {isOpen && (
                <div
                    aria-label="Bảng emoji"
                    className="absolute bottom-full right-0 z-30 mb-2 grid w-72 grid-cols-8 gap-1 rounded-xl border border-line-subtle bg-surface p-2 shadow-auth-card"
                    id={panelId}
                    role="dialog"
                >
                    {CHAT_EMOJIS.map((emoji) => (
                        <button
                            aria-label={`Chèn ${emoji}`}
                            className="grid size-8 cursor-pointer place-items-center rounded-lg text-xl hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                            key={emoji}
                            onClick={() => onSelect(emoji)}
                            type="button"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
