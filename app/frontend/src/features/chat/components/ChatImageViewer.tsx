import { ChevronLeft, ChevronRight, ImageOff, X } from 'lucide-react';
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';

import type { ChatAttachmentView } from '@/features/chat/chat.type';
import { cn } from '@/lib/utils';

interface ChatImageViewerProps {
    images: ChatAttachmentView[];
    /** Ảnh mở đầu tiên */
    startIndex: number;
    onClose: () => void;
}

const NAV_BUTTON_CLASS =
    'grid size-11 cursor-pointer place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white';

/** Popup xem ảnh toàn màn hình như Messenger */
export function ChatImageViewer({
    images,
    startIndex,
    onClose,
}: ChatImageViewerProps) {
    const [index, setIndex] = useState(startIndex);
    const [failedKeys, setFailedKeys] = useState<string[]>([]);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const onCloseRef = useRef(onClose);
    const count = images.length;
    const image = images[Math.min(index, count - 1)];
    const hasMany = count > 1;

    useEffect(() => {
        onCloseRef.current = onClose;
    });

    // Khoá cuộn trang, đưa focus vào popup, đóng thì trả focus về ảnh vừa bấm
    useEffect(() => {
        const previouslyFocused = document.activeElement as HTMLElement | null;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        closeButtonRef.current?.focus();
        return () => {
            document.body.style.overflow = previousOverflow;
            previouslyFocused?.focus();
        };
    }, []);

    // Esc để đóng, mũi tên để chuyển ảnh
    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                event.stopPropagation();
                onCloseRef.current();
            } else if (event.key === 'ArrowLeft') {
                setIndex((current) => (current - 1 + count) % count);
            } else if (event.key === 'ArrowRight') {
                setIndex((current) => (current + 1) % count);
            }
        }
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [count]);

    if (!image) return null;

    const isBroken = !image.url || failedKeys.includes(image.key);

    function showPrevious(event: MouseEvent) {
        event.stopPropagation();
        setIndex((current) => (current - 1 + count) % count);
    }

    function showNext(event: MouseEvent) {
        event.stopPropagation();
        setIndex((current) => (current + 1) % count);
    }

    return createPortal(
        <div
            aria-label={`Xem ảnh ${image.fileName}`}
            aria-modal="true"
            className="fixed inset-0 z-50 flex flex-col bg-black/90"
            onClick={onClose}
            role="dialog"
        >
            <div className="flex items-center justify-between gap-3 px-4 py-3 text-white">
                <p className="min-w-0 truncate text-body-sm">
                    {image.fileName}
                    {hasMany && (
                        <span className="ml-2 text-white/70">
                            {index + 1}/{count}
                        </span>
                    )}
                </p>
                <button
                    aria-label="Đóng"
                    className={NAV_BUTTON_CLASS}
                    onClick={onClose}
                    ref={closeButtonRef}
                    type="button"
                >
                    <X aria-hidden="true" className="size-5" />
                </button>
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6 sm:px-16">
                {isBroken ? (
                    <div
                        className="grid place-items-center gap-2 text-center text-body-sm text-white/80"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <ImageOff aria-hidden="true" className="size-8" />
                        Không tải được ảnh. Tải lại trang để thử lại.
                    </div>
                ) : (
                    <img
                        alt={image.fileName}
                        className="max-h-full max-w-full select-none rounded-lg object-contain"
                        key={image.key}
                        onClick={(event) => event.stopPropagation()}
                        onError={() =>
                            setFailedKeys((keys) => [...keys, image.key])
                        }
                        src={image.url ?? undefined}
                    />
                )}

                {hasMany && (
                    <>
                        <button
                            aria-label="Ảnh trước"
                            className={cn(
                                NAV_BUTTON_CLASS,
                                'absolute left-2 top-1/2 -translate-y-1/2 sm:left-4'
                            )}
                            onClick={showPrevious}
                            type="button"
                        >
                            <ChevronLeft
                                aria-hidden="true"
                                className="size-6"
                            />
                        </button>
                        <button
                            aria-label="Ảnh sau"
                            className={cn(
                                NAV_BUTTON_CLASS,
                                'absolute right-2 top-1/2 -translate-y-1/2 sm:right-4'
                            )}
                            onClick={showNext}
                            type="button"
                        >
                            <ChevronRight
                                aria-hidden="true"
                                className="size-6"
                            />
                        </button>
                    </>
                )}
            </div>
        </div>,
        document.body
    );
}
