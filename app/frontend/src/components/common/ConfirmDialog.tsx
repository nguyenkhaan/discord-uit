import type { ReactNode } from 'react';

import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';

export interface ConfirmDialogProps {
    isOpen: boolean;
    title: ReactNode;
    description: ReactNode;
    confirmLabel: string;
    cancelLabel?: string;
    tone?: 'primary' | 'danger';
    isPending?: boolean;
    onConfirm: () => void;
    onClose: () => void;
}

export function ConfirmDialog({
    isOpen,
    title,
    description,
    confirmLabel,
    cancelLabel = 'Hủy',
    tone = 'primary',
    isPending = false,
    onConfirm,
    onClose,
}: ConfirmDialogProps) {
    return (
        <Modal
            footer={
                <>
                    <Button
                        disabled={isPending}
                        onClick={onClose}
                        size="compact"
                        variant="secondary"
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        disabled={isPending}
                        onClick={onConfirm}
                        size="compact"
                        variant={tone}
                    >
                        {isPending ? 'Đang xử lý...' : confirmLabel}
                    </Button>
                </>
            }
            isCloseDisabled={isPending}
            isOpen={isOpen}
            onClose={onClose}
            size="sm"
            title={title}
        >
            <p className="text-body text-foreground-secondary">{description}</p>
        </Modal>
    );
}
