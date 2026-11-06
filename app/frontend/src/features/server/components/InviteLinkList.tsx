import { useId, useState } from 'react';

import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { InviteLinkItem } from '@/features/server/components/InviteLinkItem';
import { useRevokeInviteLinkMutation } from '@/features/server/server-invite.hooks';
import type { InviteLinkResponse } from '@/features/server/server.type';
import { showToast } from '@/lib/toast';

interface InviteLinkListProps {
    serverId: string;
    links: InviteLinkResponse[];
    isLoading: boolean;
    isError: boolean;
    onRetry: () => void;
}

export function InviteLinkList({
    serverId,
    links,
    isLoading,
    isError,
    onRetry,
}: InviteLinkListProps) {
    const headingId = useId();
    const [linkToRevoke, setLinkToRevoke] = useState<InviteLinkResponse | null>(
        null
    );
    const { mutate: revokeLink, isPending: isRevoking } =
        useRevokeInviteLinkMutation();

    function confirmRevoke() {
        const inviteId = linkToRevoke?.inviteId;
        if (!inviteId) return;
        revokeLink(
            { serverId, inviteId },
            {
                onSuccess: () => {
                    showToast('Đã thu hồi link mời.');
                    setLinkToRevoke(null);
                },
                onError: () =>
                    showToast('Không thể thu hồi link. Vui lòng thử lại.'),
            }
        );
    }

    const revokePosition = linkToRevoke ? links.indexOf(linkToRevoke) + 1 : 0;

    return (
        <section aria-labelledby={headingId}>
            <h3
                className="mb-2 text-sm font-semibold text-heading"
                id={headingId}
            >
                Link đang hoạt động
            </h3>

            {isLoading && (
                <div className="space-y-2" aria-busy="true">
                    {[0, 1].map((key) => (
                        <div
                            className="h-14 animate-pulse rounded-xl bg-surface-subtle"
                            key={key}
                        />
                    ))}
                </div>
            )}

            {!isLoading && isError && (
                <div className="flex items-center justify-between gap-3 rounded-xl bg-danger-subtle px-3 py-2.5 text-sm text-feedback-danger">
                    <span>Không tải được danh sách link.</span>
                    <Button onClick={onRetry} size="compact" variant="ghost">
                        Thử lại
                    </Button>
                </div>
            )}

            {!isLoading && !isError && links.length === 0 && (
                <p className="rounded-xl border border-dashed border-line px-3 py-4 text-center text-sm text-muted">
                    Chưa có link mời nào đang hoạt động.
                </p>
            )}

            {!isLoading && !isError && links.length > 0 && (
                <ul className="space-y-2">
                    {links.map((link, index) => (
                        <InviteLinkItem
                            key={link.inviteId ?? index}
                            link={link}
                            onRevoke={setLinkToRevoke}
                            position={index + 1}
                        />
                    ))}
                </ul>
            )}

            <ConfirmDialog
                confirmLabel="Thu hồi"
                description="Người khác sẽ không thể dùng link này để tham gia server nữa. Thao tác không thể hoàn tác."
                isOpen={linkToRevoke !== null}
                isPending={isRevoking}
                onClose={() => setLinkToRevoke(null)}
                onConfirm={confirmRevoke}
                title={`Thu hồi link mời #${revokePosition}?`}
                tone="danger"
            />
        </section>
    );
}
