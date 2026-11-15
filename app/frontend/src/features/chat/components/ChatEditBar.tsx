import { Pencil, X } from 'lucide-react';

import { Button } from '@/components/common/Button';

interface ChatEditBarProps {
    originalText: string;
    errorMessage?: string;
    onCancel: () => void;
}

/** Thanh "Đang sửa tin nhắn" phía trên ô nhập */
export function ChatEditBar({
    originalText,
    errorMessage,
    onCancel,
}: ChatEditBarProps) {
    return (
        <div className="mb-2 rounded-lg border-l-2 border-brand bg-brand-subtle px-3 py-1.5">
            <div className="flex items-center gap-2">
                <Pencil
                    aria-hidden="true"
                    className="size-4 shrink-0 text-brand"
                />
                <div className="min-w-0 flex-1 text-caption">
                    <p className="font-semibold text-heading">
                        Đang sửa tin nhắn
                    </p>
                    <p className="truncate text-foreground-secondary">
                        {originalText}
                    </p>
                </div>
                <Button
                    className="min-h-7 shrink-0 px-2 text-caption"
                    onClick={onCancel}
                    size="compact"
                    variant="ghost"
                >
                    <X aria-hidden="true" className="size-4" />
                    Huỷ
                </Button>
            </div>
            {errorMessage && (
                <p
                    className="mt-1 text-caption text-feedback-danger"
                    role="alert"
                >
                    {errorMessage}
                </p>
            )}
        </div>
    );
}