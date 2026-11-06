import type { VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { Button } from '@/components/common/Button';
import { modalPanelVariants } from '@/components/common/modalVariants';
import { cn } from '@/lib/utils';

const FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface ModalProps extends VariantProps<typeof modalPanelVariants> {
    isOpen: boolean;
    onClose: () => void;
    title: ReactNode;
    description?: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
    /** Chặn đóng modal khi đang gửi request để tránh mất trạng thái */
    isCloseDisabled?: boolean;
    className?: string;
}

export function Modal({
    isOpen,
    onClose,
    title,
    description,
    children,
    footer,
    isCloseDisabled = false,
    size,
    className,
}: ModalProps) {
    const titleId = useId();
    const descriptionId = useId();
    const panelRef = useRef<HTMLDivElement>(null);
    const onCloseRef = useRef(onClose);
    const isCloseDisabledRef = useRef(isCloseDisabled);

    useEffect(() => {
        onCloseRef.current = onClose;
        isCloseDisabledRef.current = isCloseDisabled;
    });

    useEffect(() => {
        if (!isOpen) return;

        const previouslyFocused = document.activeElement as HTMLElement | null;
        const panel = panelRef.current;
        const firstFocusable =
            panel?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
        (firstFocusable ?? panel)?.focus();

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                // Modal lồng nhau: chỉ modal trên cùng xử lý Esc
                event.stopPropagation();
                if (!isCloseDisabledRef.current) onCloseRef.current();
                return;
            }
            if (event.key !== 'Tab' || !panel) return;

            const focusables = Array.from(
                panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
            );
            if (focusables.length === 0) {
                event.preventDefault();
                return;
            }
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }

        panel?.addEventListener('keydown', handleKeyDown);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            panel?.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = previousOverflow;
            previouslyFocused?.focus();
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const requestClose = () => {
        if (!isCloseDisabled) onClose();
    };

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                aria-hidden="true"
                className="absolute inset-0 bg-heading/40 backdrop-blur-[2px]"
                onClick={requestClose}
            />
            <div
                aria-describedby={description ? descriptionId : undefined}
                aria-labelledby={titleId}
                aria-modal="true"
                className={cn(modalPanelVariants({ size }), className)}
                ref={panelRef}
                role="dialog"
                tabIndex={-1}
            >
                <header className="flex items-start gap-3 border-b border-line-subtle px-5 py-4">
                    <div className="min-w-0 flex-1">
                        <h2
                            className="text-lg font-bold text-heading"
                            id={titleId}
                        >
                            {title}
                        </h2>
                        {description && (
                            <p
                                className="mt-1 text-body-sm text-muted"
                                id={descriptionId}
                            >
                                {description}
                            </p>
                        )}
                    </div>
                    <Button
                        aria-label="Đóng"
                        className="size-9 min-h-9 shrink-0"
                        disabled={isCloseDisabled}
                        onClick={requestClose}
                        size="icon"
                        variant="ghost"
                    >
                        <X aria-hidden="true" className="size-5" />
                    </Button>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                    {children}
                </div>

                {footer && (
                    <footer className="flex flex-col-reverse gap-2 border-t border-line-subtle px-5 py-4 sm:flex-row sm:justify-end">
                        {footer}
                    </footer>
                )}
            </div>
        </div>,
        document.body
    );
}
