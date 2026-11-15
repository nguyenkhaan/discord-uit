import { ImageOff } from 'lucide-react';
import { useState } from 'react';

import { ChatImageViewer } from '@/features/chat/components/ChatImageViewer';
import type { ChatAttachmentView } from '@/features/chat/chat.type';
import { cn } from '@/lib/utils';

interface ChatMessageAttachmentsProps {
    attachments: ChatAttachmentView[];
    /** Chỉ cho bấm xem ảnh khi tin đã gửi xong */
    isLinkable: boolean;
}

/** Lưới ảnh trong tin nhắn, bấm để xem trong popup */
export function ChatMessageAttachments({
    attachments,
    isLinkable,
}: ChatMessageAttachmentsProps) {
    const [viewerIndex, setViewerIndex] = useState<number | null>(null);
    const isSingle = attachments.length === 1;

    return (
        <>
            <ul
                aria-label="Ảnh đính kèm"
                className={cn(
                    'grid gap-1',
                    isSingle ? 'grid-cols-1' : 'grid-cols-2',
                    attachments.length > 4 && 'sm:grid-cols-3'
                )}
            >
                {attachments.map((attachment, index) => (
                    <li key={attachment.key}>
                        <ChatAttachmentImage
                            attachment={attachment}
                            isSingle={isSingle}
                            onOpen={
                                isLinkable
                                    ? () => setViewerIndex(index)
                                    : undefined
                            }
                        />
                    </li>
                ))}
            </ul>

            {viewerIndex !== null && (
                <ChatImageViewer
                    images={attachments}
                    onClose={() => setViewerIndex(null)}
                    startIndex={viewerIndex}
                />
            )}
        </>
    );
}

interface ChatAttachmentImageProps {
    attachment: ChatAttachmentView;
    isSingle: boolean;
    /** Không truyền khi tin đang gửi */
    onOpen?: () => void;
}

/** Một ảnh; lỗi tải (link hết hạn) thì hiện ô báo lỗi */
function ChatAttachmentImage({
    attachment,
    isSingle,
    onOpen,
}: ChatAttachmentImageProps) {
    const [failedUrl, setFailedUrl] = useState<string | null>(null);
    const url = attachment.url;
    const hasError = !url || failedUrl === url;
    const sizeClass = isSingle
        ? 'max-h-72 w-auto max-w-full sm:max-w-xs'
        : 'aspect-square size-28 sm:size-32';

    if (hasError) {
        return (
            <div
                className={cn(
                    'grid place-items-center gap-1 rounded-xl border border-line bg-surface-subtle p-3 text-center text-caption text-muted',
                    isSingle ? 'h-32 w-48' : 'aspect-square size-28 sm:size-32'
                )}
                role="img"
                aria-label={`Không tải được ảnh ${attachment.fileName}`}
            >
                <ImageOff aria-hidden="true" className="size-5" />
                <span>Không tải được ảnh. Tải lại trang để thử lại.</span>
            </div>
        );
    }

    const image = (
        <img
            alt={attachment.fileName}
            className={cn(
                'rounded-xl border border-line-subtle bg-surface-subtle object-cover',
                sizeClass
            )}
            loading="lazy"
            onError={() => setFailedUrl(url)}
            src={url}
        />
    );

    if (!onOpen) return image;

    return (
        <button
            aria-label={`Xem ảnh ${attachment.fileName}`}
            className="block cursor-zoom-in rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            onClick={onOpen}
            type="button"
        >
            {image}
        </button>
    );
}
