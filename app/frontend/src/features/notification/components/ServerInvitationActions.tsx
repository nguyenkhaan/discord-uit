import { Check, X } from 'lucide-react';

import { Button } from '@/components/common/Button';
import {
    useAcceptDirectInviteMutation,
    useDeclineDirectInviteMutation,
    useMyDirectInvites,
} from '@/features/server/server-invite.hooks';
import { getApiErrorMessage } from '@/lib/api-error';
import { showToast } from '@/lib/toast';

interface ServerInvitationActionsProps {
    /** `relatedEntityId` của thông báo SERVER_INVITATION chính là inviteId */
    inviteId: string;
}

const INVITE_ERROR_MESSAGES: Partial<Record<number, string>> = {
    403: 'Bạn không có quyền phản hồi lời mời này.',
    404: 'Lời mời hoặc server không còn tồn tại.',
    409: 'Bạn đã là thành viên của server này.',
    410: 'Lời mời đã hết hạn hoặc không còn hiệu lực.',
};

export function ServerInvitationActions({
    inviteId,
}: ServerInvitationActionsProps) {
    // GET /users/me/invites chỉ trả lời mời còn PENDING; các card dùng chung một query
    const {
        data: pendingInvites,
        isPending: isLoadingInvites,
        isError,
    } = useMyDirectInvites();
    const acceptInvite = useAcceptDirectInviteMutation();
    const declineInvite = useDeclineDirectInviteMutation();

    if (isLoadingInvites || isError) return null;

    const isPendingInvite = pendingInvites?.some(
        (invite) => invite.inviteId === inviteId
    );
    if (!isPendingInvite) {
        return (
            <p className="mt-1.5 text-caption italic text-muted">
                Lời mời đã được phản hồi hoặc không còn hiệu lực.
            </p>
        );
    }

    const isResponding = acceptInvite.isPending || declineInvite.isPending;
    const handleError = (error: unknown) =>
        showToast(
            getApiErrorMessage(
                error,
                INVITE_ERROR_MESSAGES,
                'Không thể phản hồi lời mời. Vui lòng thử lại.'
            )
        );

    return (
        <div className="mt-2 flex gap-2">
            <Button
                className="min-h-8 px-3 text-xs"
                disabled={isResponding}
                onClick={() =>
                    acceptInvite.mutate(inviteId, {
                        onSuccess: ({ serverName }) =>
                            showToast(`Đã tham gia ${serverName || 'server'}.`),
                        onError: handleError,
                    })
                }
                size="compact"
            >
                <Check aria-hidden="true" className="size-3.5" />
                {acceptInvite.isPending ? 'Đang xử lý...' : 'Chấp nhận'}
            </Button>
            <Button
                className="min-h-8 px-3 text-xs"
                disabled={isResponding}
                onClick={() =>
                    declineInvite.mutate(inviteId, {
                        onSuccess: () => showToast('Đã từ chối lời mời.'),
                        onError: handleError,
                    })
                }
                size="compact"
                variant="secondary"
            >
                <X aria-hidden="true" className="size-3.5" />
                {declineInvite.isPending ? 'Đang xử lý...' : 'Từ chối'}
            </Button>
        </div>
    );
}
