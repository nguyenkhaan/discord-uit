import { Crown, UserMinus } from 'lucide-react';

import { DropdownMenu } from '@/components/common/DropdownMenu';
import { UserAvatar } from '@/components/common/UserAvatar';
import type { ServerMemberResponse } from '@/features/server/server.type';

interface ServerMemberItemProps {
    member: ServerMemberResponse;
    isCurrentUser: boolean;
    /** Hiện menu quản lý thành viên */
    canManage: boolean;
}

export function ServerMemberItem({
    member,
    isCurrentUser,
    canManage,
}: ServerMemberItemProps) {
    const name = member.fullName || 'Chưa đặt tên';
    const showMenu = canManage && !isCurrentUser && !member.isOwner;

    return (
        <li className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface-subtle">
            <UserAvatar
                name={name}
                size="sm"
                tone={isCurrentUser ? 'brand' : 'subtle'}
            />
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-heading">
                    {name}
                    {isCurrentUser && (
                        <span className="font-normal text-muted"> (Bạn)</span>
                    )}
                </p>
                {member.isOwner && (
                    <p className="inline-flex items-center gap-1 text-caption font-medium text-violet-700">
                        <Crown aria-hidden="true" className="size-3" />
                        Chủ server
                    </p>
                )}
            </div>
            {showMenu && (
                <DropdownMenu
                    items={[
                        {
                            key: 'promote',
                            label: 'Nâng làm chủ server',
                            icon: Crown,
                        },
                        {
                            key: 'kick',
                            label: 'Mời ra khỏi server',
                            icon: UserMinus,
                            tone: 'danger',
                        },
                    ]}
                    label={`Quản lý thành viên ${name}`}
                />
            )}
        </li>
    );
}
