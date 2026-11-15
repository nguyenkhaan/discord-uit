import { SmilePlus } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import { Button } from '@/components/common/Button';
import { CHAT_REACTION_ICONS } from '@/features/chat/chat.reactions';
import { cn } from '@/lib/utils';

interface ChatReactionPickerProps {
    /** Icon mình đang thả */
    myIconId: string | null;
    /** Bảng icon mở về phía nào */
    align: 'left' | 'right';
    disabled?: boolean;
    /** iconId null là bỏ reaction */
    onSelect: (iconId: string | null) => void;
}

/** Nút mở hàng icon reaction cạnh bong bóng tin nhắn */
export function ChatReactionPicker({
    myIconId,
    align,
    disabled,
    onSelect,
}: ChatReactionPickerProps) {
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

    // Bấm lại icon đang thả thì bỏ reaction
    function select(iconId: string) {
        onSelect(iconId === myIconId ? null : iconId);
        setIsOpen(false);
        triggerRef.current?.focus();
    }

    return (
        <div className="relative" ref={containerRef}>
            <Button
                aria-controls={isOpen ? panelId : undefined}
                aria-expanded={isOpen}
                aria-label="Thả cảm xúc"
                className={cn(
                    'size-8 min-h-8 shrink-0 focus-visible:opacity-100',
                    isOpen
                        ? 'opacity-100'
                        : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
                )}
                disabled={disabled}
                onClick={() => setIsOpen((open) => !open)}
                ref={triggerRef}
                size="icon"
                title="Thả cảm xúc"
                variant="ghost"
            >
                <SmilePlus aria-hidden="true" className="size-4" />
            </Button>

            {isOpen && (
                <div
                    aria-label="Chọn cảm xúc"
                    className={cn(
                        'absolute bottom-full z-30 mb-1 flex gap-0.5 rounded-full border border-line-subtle bg-surface p-1 shadow-auth-card',
                        align === 'right' ? 'right-0' : 'left-0'
                    )}
                    id={panelId}
                    role="dialog"
                >
                    {CHAT_REACTION_ICONS.map((icon) => {
                        const isMine = icon.iconId === myIconId;
                        return (
                            <button
                                aria-label={
                                    isMine
                                        ? `Bỏ ${icon.verb}`
                                        : `Thả ${icon.emoji}`
                                }
                                aria-pressed={isMine}
                                className={cn(
                                    'grid size-9 cursor-pointer place-items-center rounded-full text-xl transition-transform hover:scale-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus',
                                    isMine && 'bg-brand-subtle'
                                )}
                                key={icon.iconId}
                                onClick={() => select(icon.iconId)}
                                title={icon.verb}
                                type="button"
                            >
                                {icon.emoji}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
