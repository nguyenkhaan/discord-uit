import { Button } from '@/components/common/Button';
import { ServerMemberItem } from '@/features/server/components/ServerMemberItem';
import type { ServerMemberResponse } from '@/features/server/server.type';

interface ServerMembersTabProps {
    members: ServerMemberResponse[];
    isLoading: boolean;
    isError: boolean;
    onRetry: () => void;
    currentUserId?: string;
    canManage: boolean;
}

/** Sắp xếp: chủ server trước, sau đó theo tên */
function sortMembers(members: ServerMemberResponse[]): ServerMemberResponse[] {
    return [...members].sort((a, b) => {
        if (a.isOwner !== b.isOwner) return a.isOwner ? -1 : 1;
        return (a.fullName ?? '').localeCompare(b.fullName ?? '', 'vi');
    });
}

export function ServerMembersTab({
    members,
    isLoading,
    isError,
    onRetry,
    currentUserId,
    canManage,
}: ServerMembersTabProps) {
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
                    />
                ))}
            </ul>
        </section>
    );
}
