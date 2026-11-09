import type { LucideIcon } from 'lucide-react';
import { EllipsisVertical } from 'lucide-react';
import {
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
    type KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/utils';

export interface AdminRowMenuItem {
    key: string;
    label: string;
    icon: LucideIcon;
    tone?: 'default' | 'success' | 'warning' | 'danger';
    dividerBefore?: boolean;
    onSelect: () => void;
}

interface AdminRowMenuProps {
    label: string;
    items: AdminRowMenuItem[];
}

interface MenuPosition {
    left: number;
    top: number;
}

const MENU_WIDTH = 176;
const VIEWPORT_GAP = 8;

const ITEM_TONE_CLASSES: Record<
    NonNullable<AdminRowMenuItem['tone']>,
    string
> = {
    default:
        'text-foreground hover:bg-surface-subtle focus-visible:bg-surface-subtle',
    success:
        'text-feedback-success hover:bg-success-subtle focus-visible:bg-success-subtle',
    warning:
        'text-feedback-warning hover:bg-warning-subtle focus-visible:bg-warning-subtle',
    danger: 'text-feedback-danger hover:bg-danger-subtle focus-visible:bg-danger-subtle',
};

/**
 * Menu thao tác cho một dòng trong bảng.
 * Render qua portal với position: fixed để không bị cắt bởi vùng cuộn ngang của bảng.
 */
export function AdminRowMenu({ label, items }: AdminRowMenuProps) {
    const menuId = useId();
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState<MenuPosition | null>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

    // Đo kích thước thật của menu rồi mới đặt vị trí, lật lên trên khi thiếu chỗ phía dưới
    useLayoutEffect(() => {
        if (!isOpen || !triggerRef.current || !menuRef.current) return;

        const trigger = triggerRef.current.getBoundingClientRect();
        const menuHeight = menuRef.current.offsetHeight;
        const fitsBelow =
            trigger.bottom + menuHeight + VIEWPORT_GAP <= window.innerHeight;

        setPosition({
            left: Math.max(VIEWPORT_GAP, trigger.right - MENU_WIDTH),
            top: fitsBelow
                ? trigger.bottom + 4
                : Math.max(VIEWPORT_GAP, trigger.top - menuHeight - 4),
        });
    }, [isOpen]);

    // Chỉ focus sau khi menu đã có vị trí và hiển thị (phần tử invisible không nhận focus)
    useEffect(() => {
        if (position) itemRefs.current[0]?.focus();
    }, [position]);

    useEffect(() => {
        if (!isOpen) return;

        const handlePointerDown = (event: MouseEvent) => {
            const target = event.target as Node;
            if (
                menuRef.current?.contains(target) ||
                triggerRef.current?.contains(target)
            )
                return;
            setIsOpen(false);
        };
        const close = () => setIsOpen(false);

        document.addEventListener('mousedown', handlePointerDown);
        window.addEventListener('scroll', close, true);
        window.addEventListener('resize', close);
        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            window.removeEventListener('scroll', close, true);
            window.removeEventListener('resize', close);
        };
    }, [isOpen]);

    function closeAndFocusTrigger() {
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
            closeAndFocusTrigger();
        } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            focusAt(currentIndex + 1);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            focusAt(currentIndex - 1);
        } else if (event.key === 'Home') {
            event.preventDefault();
            focusAt(0);
        } else if (event.key === 'End') {
            event.preventDefault();
            focusAt(items.length - 1);
        } else if (event.key === 'Tab') {
            setIsOpen(false);
        }
    }

    function toggle() {
        setPosition(null);
        setIsOpen((open) => !open);
    }

    return (
        <>
            <button
                aria-controls={isOpen ? menuId : undefined}
                aria-expanded={isOpen}
                aria-haspopup="menu"
                aria-label={label}
                className={cn(
                    'grid size-9 cursor-pointer place-items-center rounded-lg text-muted transition-colors hover:bg-brand-subtle hover:text-brand focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus',
                    isOpen && 'bg-brand-subtle text-brand'
                )}
                onClick={toggle}
                ref={triggerRef}
                type="button"
            >
                <EllipsisVertical aria-hidden="true" className="size-4" />
            </button>

            {isOpen &&
                createPortal(
                    <div
                        className={cn(
                            'fixed z-60 rounded-xl border border-line-subtle bg-surface py-1.5 shadow-auth-card',
                            !position && 'invisible'
                        )}
                        id={menuId}
                        onKeyDown={handleMenuKeyDown}
                        ref={menuRef}
                        role="menu"
                        style={{
                            width: MENU_WIDTH,
                            left: position?.left ?? 0,
                            top: position?.top ?? 0,
                        }}
                    >
                        {items.map((item, index) => {
                            const Icon = item.icon;
                            return (
                                <div key={item.key}>
                                    {item.dividerBefore && (
                                        <div
                                            className="my-1.5 border-t border-line-subtle"
                                            role="separator"
                                        />
                                    )}
                                    <button
                                        className={cn(
                                            'flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2 text-left text-sm transition-colors focus-visible:outline-none',
                                            ITEM_TONE_CLASSES[
                                                item.tone ?? 'default'
                                            ]
                                        )}
                                        onClick={() => {
                                            closeAndFocusTrigger();
                                            item.onSelect();
                                        }}
                                        ref={(element) => {
                                            itemRefs.current[index] = element;
                                        }}
                                        role="menuitem"
                                        tabIndex={-1}
                                        type="button"
                                    >
                                        <Icon
                                            aria-hidden="true"
                                            className="size-4 shrink-0"
                                        />
                                        {item.label}
                                    </button>
                                </div>
                            );
                        })}
                    </div>,
                    document.body
                )}
        </>
    );
}
