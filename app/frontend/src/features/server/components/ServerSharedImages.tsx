import { ImageOff } from 'lucide-react';
import { useState } from 'react';

import { ChatImageViewer } from '@/features/chat/components/ChatImageViewer';
import type { SharedChatImage } from '@/features/chat/chat.utils';

/** Số ảnh nhỏ hiện trong panel */
const MAX_VISIBLE_IMAGES = 9;

interface ServerSharedImagesProps {
    images: SharedChatImage[];
}

/** Lưới ảnh đã gửi, bấm để xem trong popup */
export function ServerSharedImages({ images }: ServerSharedImagesProps) {
    const [viewerIndex, setViewerIndex] = useState<number | null>(null);

    if (images.length === 0) {
        return (
            <p className="text-body-sm text-muted">
                Chưa có ảnh nào trong các tin nhắn đã tải.
            </p>
        );
    }

    const visibleImages = images.slice(0, MAX_VISIBLE_IMAGES);
    const hiddenCount = images.length - visibleImages.length;

    return (
        <>
            <ul aria-label="Ảnh đã gửi" className="grid grid-cols-3 gap-1.5">
                {visibleImages.map((image, index) => {
                    const isLast = index === visibleImages.length - 1;
                    return (
                        <li key={image.key}>
                            <button
                                aria-label={`Xem ảnh ${image.fileName}`}
                                className="relative block aspect-square w-full cursor-pointer overflow-hidden rounded-lg border border-line-subtle bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                                onClick={() => setViewerIndex(index)}
                                type="button"
                            >
                                {image.url ? (
                                    <img
                                        alt=""
                                        className="size-full object-cover"
                                        loading="lazy"
                                        src={image.url}
                                    />
                                ) : (
                                    <ImageOff
                                        aria-hidden="true"
                                        className="m-auto size-5 text-muted"
                                    />
                                )}
                                {/* Ô cuối hiện số ảnh còn lại */}
                                {isLast && hiddenCount > 0 && (
                                    <span className="absolute inset-0 grid place-items-center bg-black/50 text-body font-semibold text-white">
                                        +{hiddenCount}
                                    </span>
                                )}
                            </button>
                        </li>
                    );
                })}
            </ul>

            {viewerIndex !== null && (
                <ChatImageViewer
                    images={images}
                    onClose={() => setViewerIndex(null)}
                    startIndex={viewerIndex}
                />
            )}
        </>
    );
}
