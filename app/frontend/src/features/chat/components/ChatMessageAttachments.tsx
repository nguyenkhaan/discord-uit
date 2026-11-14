import { ImageOff } from 'lucide-react';
import { useState } from 'react';

import type { ChatAttachmentView } from '@/features/chat/chat.type';
import { cn } from '@/lib/utils';

interface ChatMessageAttachmentsProps {
    attachments: ChatAttachmentView[];
    /** Chỉ cho bấm mở ảnh khi tin đã gửi xong */
    isLinkable: boolean;
}

/** Lưới ảnh trong tin nhắn, bấm để mở ảnh gốc ở tab mới */
export function ChatMessageAttachments({
    attachments,
    isLinkable,
}: ChatMessageAttachmentsProps) {
    const isSingle = attachments.length === 1;

    return (
        <ul
            aria-label="Ảnh đính kèm"
            className={cn(
                'grid gap-1',
                isSingle ? 'grid-cols-1' : 'grid-cols-2',
                attachments.length > 4 && 'sm:grid-cols-3'
            )}
        >
            {attachments.map((attachment) => (
                <li key={attachment.key}>
                    <ChatAttachmentImage
                        attachment={attachment}
                        isLinkable={isLinkable}
                        isSingle={isSingle}
                    />
                </li>
            ))}
        </ul>
    );
}

interface ChatAttachmentImageProps {
    attachment: ChatAttachmentView;
    isLinkable: boolean;
    isSingle: boolean;
}

/** Một ảnh; lỗi tải (link hết hạn) thì hiện ô báo lỗi */
function ChatAttachmentImage({
    attachment,
    isLinkable,
    isSingle,
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

    if (!isLinkable) return image;

    return (
        <a
            aria-label={`Mở ảnh ${attachment.fileName}`}
            className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            href={url}
            rel="noopener noreferrer"
            target="_blank"
        >
            {image}
        </a>
    );
}
