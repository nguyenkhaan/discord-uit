import { X } from 'lucide-react';

import type { ChatAttachmentDraft } from '@/features/chat/chat.type';

interface ChatAttachmentPreviewProps {
    attachments: ChatAttachmentDraft[];
    onRemove: (id: string) => void;
}

/** Ảnh thu nhỏ của các ảnh đã chọn */
export function ChatAttachmentPreview({
    attachments,
    onRemove,
}: ChatAttachmentPreviewProps) {
    if (attachments.length === 0) return null;

    return (
        <ul aria-label="Ảnh đã chọn" className="mb-2 flex flex-wrap gap-2">
            {attachments.map((attachment) => (
                <li className="relative" key={attachment.id}>
                    <img
                        alt={attachment.file.name}
                        className="size-16 rounded-lg border border-line-subtle object-cover"
                        src={attachment.previewUrl}
                        title={attachment.file.name}
                    />
                    <button
                        aria-label={`Bỏ ảnh ${attachment.file.name}`}
                        className="absolute -right-1.5 -top-1.5 grid size-6 cursor-pointer place-items-center rounded-full bg-heading text-on-brand shadow hover:bg-feedback-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                        onClick={() => onRemove(attachment.id)}
                        type="button"
                    >
                        <X aria-hidden="true" className="size-3.5" />
                    </button>
                </li>
            ))}
        </ul>
    );
}
