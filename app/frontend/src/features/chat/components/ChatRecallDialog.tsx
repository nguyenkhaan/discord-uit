import { useId, useState } from 'react';

import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import type { ChatMessageView } from '@/features/chat/chat.type';
import {
    IMAGE_ONLY_REPLY_TEXT,
    MAX_RECALL_REASON_LENGTH,
} from '@/features/chat/chat.utils';
import { cn } from '@/lib/utils';

interface ChatRecallDialogProps {
    message: ChatMessageView;
    /** Owner gỡ tin của người khác: bắt buộc nhập lý do */
    requiresReason: boolean;
    senderName: string;
    isPending: boolean;
    error?: string;
    onConfirm: (reason?: string) => void;
    onClose: () => void;
}

/** Hộp thoại xác nhận thu hồi; chỉ render khi đang có tin cần thu hồi */
export function ChatRecallDialog({
    message,
    requiresReason,
    senderName,
    isPending,
    error,
    onConfirm,
    onClose,
}: ChatRecallDialogProps) {
    const reasonId = useId();
    const [reason, setReason] = useState('');
    const trimmedReason = reason.trim();
    const isReasonValid =
        !requiresReason ||
        (trimmedReason !== '' &&
            trimmedReason.length <= MAX_RECALL_REASON_LENGTH);
    const preview = message.contentText.trim() || IMAGE_ONLY_REPLY_TEXT;

    function handleConfirm() {
        if (!isReasonValid || isPending) return;
        onConfirm(requiresReason ? trimmedReason : undefined);
    }

    return (
        <Modal
            description={
                requiresReason
                    ? `Bạn đang gỡ tin nhắn của ${senderName}. Mọi người sẽ chỉ thấy “Đã thu hồi”.`
                    : 'Mọi người trong server sẽ chỉ thấy “Đã thu hồi”. Bạn không thể hoàn tác.'
            }
            footer={
                <>
                    <Button
                        disabled={isPending}
                        onClick={onClose}
                        size="compact"
                        variant="secondary"
                    >
                        Hủy
                    </Button>
                    <Button
                        disabled={isPending || !isReasonValid}
                        onClick={handleConfirm}
                        size="compact"
                        variant="danger"
                    >
                        {isPending ? 'Đang thu hồi...' : 'Thu hồi'}
                    </Button>
                </>
            }
            isCloseDisabled={isPending}
            isOpen
            onClose={onClose}
            size="sm"
            title="Thu hồi tin nhắn?"
        >
            <blockquote className="line-clamp-3 break-words rounded-lg border-l-4 border-line bg-surface-subtle px-3 py-2 text-body-sm text-foreground-secondary">
                {preview}
            </blockquote>

            {requiresReason && (
                <div className="mt-4">
                    <label
                        className="mb-1 block text-body-sm font-semibold text-foreground"
                        htmlFor={reasonId}
                    >
                        Lý do <span className="text-feedback-danger">*</span>
                    </label>
                    <textarea
                        className={cn(
                            'block w-full resize-none rounded-lg border border-line bg-surface px-3 py-2 text-body text-foreground outline-none',
                            'placeholder:text-placeholder focus:border-brand focus:ring-3 focus:ring-focus/20',
                            'disabled:cursor-not-allowed disabled:opacity-60'
                        )}
                        disabled={isPending}
                        id={reasonId}
                        maxLength={MAX_RECALL_REASON_LENGTH}
                        onChange={(event) => setReason(event.target.value)}
                        placeholder="Ví dụ: spam, nội dung không phù hợp..."
                        rows={3}
                        value={reason}
                    />
                    <p className="mt-1 text-right text-caption text-muted">
                        {trimmedReason.length}/{MAX_RECALL_REASON_LENGTH}
                    </p>
                </div>
            )}

            {error && (
                <p className="mt-3 text-caption text-feedback-danger" role="alert">
                    {error}
                </p>
            )}
        </Modal>
    );
}