import { useState } from 'react';

import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ServerMemberItem } from '@/features/server/components/ServerMemberItem';
import {
    useKickServerMemberMutation,
    usePromoteServerMemberMutation,
} from '@/features/server/server-member.hooks';
import type { ServerMemberResponse } from '@/features/server/server.type';
import { getApiErrorMessage } from '@/lib/api-error';

/** Hành động đang chờ xác nhận */
interface PendingAction {
    type: 'promote' | 'kick';
    member: ServerMemberResponse;
}

/** Lỗi theo mã HTTP */
const ERROR_MESSAGES: Record<
    PendingAction['type'],
    Partial<Record<number, string>>
> = {
    promote: {
        403: 'Chỉ chủ server mới nâng quyền được.',
        404: 'Người này không còn trong server.',
        409: 'Người này đã là chủ server.',
    },
    kick: {
        400: 'Bạn không thể tự mời mình ra. Hãy dùng Rời server.',
        403: 'Chỉ chủ server mới mời thành viên ra được.',
        404: 'Người này không còn trong server.',
        409: 'Không thể mời chủ server ra khỏi server.',
    },
};

interface ServerMembersTabProps {
    serverId: string;
    members: ServerMemberResponse[];
    isLoading: boolean;
    isError: boolean;
    onRetry: () => void;
    currentUserId?: string;
    canManage: boolean;
}

function memberName(member: ServerMemberResponse | undefined): string {
    return member?.fullName || 'thành viên này';
}

/** Sắp xếp: chủ server trước, sau đó theo tên */
function sortMembers(members: ServerMemberResponse[]): ServerMemberResponse[] {
    return [...members].sort((a, b) => {
        if (a.isOwner !== b.isOwner) return a.isOwner ? -1 : 1;
        return (a.fullName ?? '').localeCompare(b.fullName ?? '', 'vi');
    });
}

export function ServerMembersTab({
    serverId,
    members,
    isLoading,
    isError,
    onRetry,
    currentUserId,
    canManage,
}: ServerMembersTabProps) {
    const [pending, setPending] = useState<PendingAction | null>(null);
    const promoteMutation = usePromoteServerMemberMutation();
    const kickMutation = useKickServerMemberMutation();
    const mutation = pending?.type === 'kick' ? kickMutation : promoteMutation;

    function closeDialog() {
        setPending(null);
        promoteMutation.reset();
        kickMutation.reset();
    }

    // Xác nhận xong thì gọi API, thành công thì đóng hộp thoại
    function confirm() {
        if (!pending?.member.userId) return;
        mutation.mutate(
            { serverId, userId: pending.member.userId },
            { onSuccess: closeDialog }
        );
    }

    if (isLoading) {
        return (
            <div aria-busy="true" className="space-y-2">
                {[0, 1, 2, 3].map((key) => (
                    <div
                        className="h-12 animate-pulse rounded-lg bg-surface-subtle"
                        key={key}
                    />
                ))}
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-danger-subtle px-3 py-2.5 text-sm text-feedback-danger">
                <span>Không tải được danh sách thành viên.</span>
                <Button onClick={onRetry} size="compact" variant="ghost">
                    Thử lại
                </Button>
            </div>
        );
    }

    return (
        <section aria-label="Danh sách thành viên">
            <p className="mb-2 text-caption font-semibold uppercase tracking-wide text-muted">
                {members.length} thành viên
            </p>
            <ul className="space-y-0.5">
                {sortMembers(members).map((member) => (
                    <ServerMemberItem
                        canManage={canManage}
                        isCurrentUser={member.userId === currentUserId}
                        key={member.userId}
                        member={member}
                        onKick={(target) =>
                            setPending({ type: 'kick', member: target })
                        }
                        onPromote={(target) =>
                            setPending({ type: 'promote', member: target })
                        }
                    />
                ))}
            </ul>

            <ConfirmDialog
                confirmLabel={
                    pending?.type === 'kick' ? 'Mời ra' : 'Nâng làm chủ'
                }
                description={
                    <>
                        {pending?.type === 'kick'
                            ? `${memberName(pending.member)} sẽ không xem được tin nhắn của server nữa, trừ khi được mời lại.`
                            : `${memberName(pending?.member)} sẽ có toàn quyền quản lý server như bạn, và không thể hạ quyền lại.`}
                        {mutation.isError && (
                            <span
                                className="mt-2 block text-feedback-danger"
                                role="alert"
                            >
                                {getApiErrorMessage(
                                    mutation.error,
                                    ERROR_MESSAGES[pending?.type ?? 'promote'],
                                    'Không thực hiện được. Vui lòng thử lại.'
                                )}
                            </span>
                        )}
                    </>
                }
                isOpen={pending !== null}
                isPending={mutation.isPending}
                onClose={closeDialog}
                onConfirm={confirm}
                title={
                    pending?.type === 'kick'
                        ? `Mời ${memberName(pending.member)} ra khỏi server?`
                        : `Nâng ${memberName(pending?.member)} làm chủ server?`
                }
                tone={pending?.type === 'kick' ? 'danger' : 'primary'}
            />
        </section>
    );
}
