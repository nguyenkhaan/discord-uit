import { LogOut, Settings2, UserPlus } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ServerInviteModal } from '@/features/server/components/ServerInviteModal';
import { ServerSharedImages } from '@/features/server/components/ServerSharedImages';
import { ServerSharedLinks } from '@/features/server/components/ServerSharedLinks';
import { ServerStatusBadge } from '@/features/server/components/ServerStatusBadge';
import { ServerStatusDialog } from '@/features/server/components/ServerStatusDialog';
import { useLeaveServerMutation } from '@/features/server/server-member.hooks';
import { getServerStatus } from '@/features/server/server.status';
import type { ServerResponse } from '@/features/server/server.type';
import type {
    SharedChatImage,
    SharedChatLink,
} from '@/features/chat/chat.utils';
import { getApiErrorMessage } from '@/lib/api-error';

interface ServerInfoTabProps {
    server: ServerResponse;
    sharedLinks: SharedChatLink[];
    sharedImages: SharedChatImage[];
    getSenderName: (userId: string) => string;
}

/** Lỗi rời server theo mã HTTP */
const LEAVE_ERROR_MESSAGES: Partial<Record<number, string>> = {
    409: 'Bạn là thành viên duy nhất nên không thể rời server.',
    404: 'Bạn không còn là thành viên của server này.',
};

function InfoSection({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <section className="border-b border-line-subtle pb-4 last:border-b-0">
            <h3 className="mb-2 text-caption font-semibold uppercase tracking-wide text-muted">
                {title}
            </h3>
            {children}
        </section>
    );
}

export function ServerInfoTab({
    server,
    sharedLinks,
    sharedImages,
    getSenderName,
}: ServerInfoTabProps) {
    const navigate = useNavigate();
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [isLeaveOpen, setIsLeaveOpen] = useState(false);
    const leaveMutation = useLeaveServerMutation();
    const isOwner = server.myRole === 'OWNER';

    // Rời xong thì về danh sách server
    function handleLeave() {
        if (!server.id) return;
        leaveMutation.mutate(server.id, {
            onSuccess: () => navigate('/servers', { replace: true }),
        });
    }

    function closeLeaveDialog() {
        setIsLeaveOpen(false);
        leaveMutation.reset();
    }

    return (
        <div className="space-y-4">
            <InfoSection title="Giới thiệu server">
                <p className="whitespace-pre-wrap break-words text-body-sm text-muted">
                    {server.description?.trim() || 'Server này chưa có mô tả.'}
                </p>
            </InfoSection>

            <InfoSection title="Link đã gửi">
                <ServerSharedLinks
                    getSenderName={getSenderName}
                    links={sharedLinks}
                />
            </InfoSection>

            <InfoSection title="Ảnh đã gửi">
                <ServerSharedImages images={sharedImages} />
            </InfoSection>

            {isOwner && (
                <InfoSection title="Link mời">
                    <Button
                        fullWidth
                        onClick={() => setIsInviteOpen(true)}
                        size="compact"
                        variant="secondary"
                    >
                        <UserPlus aria-hidden="true" className="size-4" />
                        Quản lý link mời
                    </Button>
                </InfoSection>
            )}

            {isOwner && (
                <InfoSection title="Trạng thái server">
                    <div className="flex items-center justify-between gap-2">
                        <ServerStatusBadge status={getServerStatus(server)} />
                        <Button
                            onClick={() => setIsStatusOpen(true)}
                            size="compact"
                            variant="ghost"
                        >
                            <Settings2 aria-hidden="true" className="size-4" />
                            Đổi trạng thái
                        </Button>
                    </div>
                </InfoSection>
            )}

            <InfoSection title="Thành viên">
                <Button
                    className="text-feedback-danger hover:bg-danger-subtle hover:text-feedback-danger"
                    fullWidth
                    onClick={() => setIsLeaveOpen(true)}
                    size="compact"
                    variant="ghost"
                >
                    <LogOut aria-hidden="true" className="size-4" />
                    Rời server
                </Button>
            </InfoSection>

            <ServerInviteModal
                onClose={() => setIsInviteOpen(false)}
                server={isInviteOpen ? server : null}
            />

            {isStatusOpen && (
                <ServerStatusDialog
                    onClose={() => setIsStatusOpen(false)}
                    server={server}
                />
            )}

            <ConfirmDialog
                confirmLabel="Rời server"
                description={
                    <>
                        {isOwner
                            ? 'Quyền chủ server sẽ được chuyển cho một thành viên khác. '
                            : ''}
                        Bạn sẽ không xem được tin nhắn của server này nữa, trừ
                        khi được mời lại.
                        {leaveMutation.isError && (
                            <span
                                className="mt-2 block text-feedback-danger"
                                role="alert"
                            >
                                {getApiErrorMessage(
                                    leaveMutation.error,
                                    LEAVE_ERROR_MESSAGES,
                                    'Không rời được server. Vui lòng thử lại.'
                                )}
                            </span>
                        )}
                    </>
                }
                isOpen={isLeaveOpen}
                isPending={leaveMutation.isPending}
                onClose={closeLeaveDialog}
                onConfirm={handleLeave}
                title={`Rời ${server.name ?? 'server'}?`}
                tone="danger"
            />
        </div>
    );
}
