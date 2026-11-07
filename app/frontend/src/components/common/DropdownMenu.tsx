import type { LucideIcon } from 'lucide-react';
import { EllipsisVertical } from 'lucide-react';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';

import { Button } from '@/components/common/Button';
import { cn } from '@/lib/utils';

export interface DropdownMenuItem {
    key: string;
    label: string;
    icon?: LucideIcon;
    tone?: 'default' | 'danger';
    /** Bỏ trống khi chức năng chưa có */
    onSelect?: () => void;
}

export interface DropdownMenuProps {
    /** Nhãn của nút mở menu */
    label: string;
    items: DropdownMenuItem[];
    className?: string;
}

export function DropdownMenu({ label, items, className }: DropdownMenuProps) {
    const menuId = useId();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

    useEffect(() => {
        if (!isOpen) return;
        itemRefs.current[0]?.focus();

        function closeOnOutsideClick(event: MouseEvent) {
            if (!containerRef.current?.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', closeOnOutsideClick);
        return () =>
            document.removeEventListener('mousedown', closeOnOutsideClick);
    }, [isOpen]);

    function close() {
        setIsOpen(false);
        triggerRef.current?.focus();
    }

    function handleMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
        const currentIndex = itemRefs.current.findIndex(
            (item) => item === document.activeElement
        );
        const focusAt = (index: number) =>
            itemRefs.current[(index + items.length) % items.length]?.focus();

        if (event.key === 'Escape') {
            event.preventDefault();
            close();
        } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            focusAt(currentIndex + 1);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            focusAt(currentIndex - 1);
        } else if (event.key === 'Tab') {
            setIsOpen(false);
        }
    }

    return (
        <div className={cn('relative', className)} ref={containerRef}>
            <Button
                aria-controls={isOpen ? menuId : undefined}
                aria-expanded={isOpen}
                aria-haspopup="menu"
                aria-label={label}
                className="size-8 min-h-8"
                onClick={() => setIsOpen((open) => !open)}
                ref={triggerRef}
                size="icon"
                variant="ghost"
            >
                <EllipsisVertical aria-hidden="true" className="size-4" />
            </Button>

            {isOpen && (
                <div
                    className="absolute right-0 top-full z-30 mt-1 min-w-44 rounded-lg border border-line-subtle bg-surface py-1 shadow-auth-card"
                    id={menuId}
                    onKeyDown={handleMenuKeyDown}
                    role="menu"
                >
                    {items.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <button
                                className={cn(
                                    'flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none',
                                    item.tone === 'danger'
                                        ? 'text-feedback-danger hover:bg-danger-subtle focus-visible:bg-danger-subtle'
                                        : 'text-foreground hover:bg-surface-subtle focus-visible:bg-surface-subtle'
                                )}
                                key={item.key}
                                onClick={() => {
                                    close();
                                    item.onSelect?.();
                                }}
                                ref={(element) => {
                                    itemRefs.current[index] = element;
                                }}
                                role="menuitem"
                                tabIndex={-1}
                                type="button"
                            >
                                {Icon && (
                                    <Icon
                                        aria-hidden="true"
                                        className="size-4"
                                    />
                                )}
                                {item.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
