import { useState } from 'react';

import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { ServerStatusBadge } from '@/features/server/components/ServerStatusBadge';
import { useUpdateServerStatusMutation } from '@/features/server/server.hooks';
import {
    getServerStatus,
    SERVER_STATUSES,
} from '@/features/server/server.status';
import type {
    ServerResponse,
    ServerStatus,
} from '@/features/server/server.type';
import { cn } from '@/lib/utils';

/** Giải thích ngắn cho từng trạng thái */
const STATUS_DESCRIPTIONS: Record<ServerStatus, string> = {
    ACTIVE: 'Thành viên nhắn tin bình thường.',
    LOCKED: 'Tạm khóa: mọi người chỉ xem được tin cũ, không gửi tin mới.',
    CLOSED: 'Đóng server: không ai gửi được tin nhắn nữa.',
};

interface ServerStatusDialogProps {
    server: ServerResponse;
    onClose: () => void;
}

/** Hộp thoại đổi trạng thái server (chỉ chủ server) */
export function ServerStatusDialog({
    server,
    onClose,
}: ServerStatusDialogProps) {
    const currentStatus = getServerStatus(server);
    const [selected, setSelected] = useState<ServerStatus>(currentStatus);
    const { mutate, isPending, isError } = useUpdateServerStatusMutation();

    function handleSave() {
        if (!server.id || selected === currentStatus) {
            onClose();
            return;
        }
        mutate(
            { serverId: server.id, status: selected },
            { onSuccess: onClose }
        );
    }

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
                        Hủy
                    </Button>
                    <Button
                        disabled={isPending}
                        onClick={handleSave}
                        size="compact"
                    >
                        {isPending ? 'Đang lưu...' : 'Lưu'}
                    </Button>
                </>
            }
            isCloseDisabled={isPending}
            isOpen
            onClose={onClose}
            size="sm"
            title="Đổi trạng thái server"
        >
            <fieldset className="space-y-2">
                <legend className="sr-only">Trạng thái server</legend>
                {SERVER_STATUSES.map((status) => (
                    <label
                        className={cn(
                            'flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors',
                            selected === status
                                ? 'border-brand bg-brand-subtle'
                                : 'border-line hover:bg-surface-subtle'
                        )}
                        key={status}
                    >
                        <input
                            checked={selected === status}
                            className="mt-1 accent-brand"
                            disabled={isPending}
                            name="server-status"
                            onChange={() => setSelected(status)}
                            type="radio"
                            value={status}
                        />
                        <span className="min-w-0 space-y-1">
                            <ServerStatusBadge status={status} />
                            <span className="block text-body-sm text-muted">
                                {STATUS_DESCRIPTIONS[status]}
                            </span>
                        </span>
                    </label>
                ))}
            </fieldset>
            {isError && (
                <p
                    className="mt-3 text-body-sm text-feedback-danger"
                    role="alert"
                >
                    Không đổi được trạng thái. Vui lòng thử lại.
                </p>
            )}
        </Modal>
    );
}
