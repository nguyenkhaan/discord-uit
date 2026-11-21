import { Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useDeleteForumPostMutation } from '@/features/forum/forum.hooks';

interface ForumDeletePostButtonProps {
    postId: string;
    title: string | undefined;
    onDeleted?: () => void;
}

/** Nút xoá bài kèm hộp thoại xác nhận */
export function ForumDeletePostButton({
    postId,
    title,
    onDeleted,
}: ForumDeletePostButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { mutate, isPending, isError, reset } = useDeleteForumPostMutation();

    function close() {
        setIsOpen(false);
        reset();
    }

    function confirm() {
        mutate(postId, {
            onSuccess: () => {
                setIsOpen(false);
                onDeleted?.();
            },
        });
    }

    return (
        <>
            <Button
                className="text-feedback-danger hover:bg-danger-subtle hover:text-feedback-danger"
                onClick={() => setIsOpen(true)}
                size="compact"
                variant="ghost"
            >
                <Trash2 aria-hidden="true" className="size-4" />
                Xoá
            </Button>
            <ConfirmDialog
                confirmLabel="Xoá bài"
                description={
                    <>
                        Bài viết sẽ bị xoá khỏi diễn đàn và không khôi phục
                        được.
                        {isError && (
                            <span
                                className="mt-2 block text-feedback-danger"
                                role="alert"
                            >
                                Không xoá được bài. Vui lòng thử lại.
                            </span>
                        )}
                    </>
                }
                isOpen={isOpen}
                isPending={isPending}
                onClose={close}
                onConfirm={confirm}
                title={`Xoá “${title ?? 'bài viết'}”?`}
                tone="danger"
            />
        </>
    );
}
