import { Clock, Users } from 'lucide-react';

import { Button } from '@/components/common/Button';
import { ServerAvatar } from '@/features/server/components/ServerAvatar';
import { formatInviteExpiry } from '@/features/server/server-invite.utils';
import type { InviteLinkDetailsResponse } from '@/features/server/server.type';

interface InviteJoinCardProps {
    invite: InviteLinkDetailsResponse;
    isJoining: boolean;
    errorMessage?: string;
    onJoin: () => void;
}

export function InviteJoinCard({
    invite,
    isJoining,
    errorMessage,
    onJoin,
}: InviteJoinCardProps) {
    const remainingUses = Math.max(
        0,
        (invite.maxUses ?? 0) - (invite.useCount ?? 0)
    );

    return (
        <div className="flex flex-col items-center text-center">
            <ServerAvatar
                imageUrl={invite.groupImageUrl}
                name={invite.serverName}
                size="lg"
            />
            <p className="mt-4 text-sm text-muted">Bạn được mời tham gia</p>
            <h1 className="mt-1 text-2xl font-extrabold text-heading break-words">
                {invite.serverName || 'Server chưa đặt tên'}
            </h1>

            <ul className="mt-4 flex flex-wrap justify-center gap-2 text-caption text-foreground-secondary">
                <li className="inline-flex items-center gap-1.5 rounded-full bg-surface-subtle px-3 py-1">
                    <Users aria-hidden="true" className="size-3.5" />
                    Còn {remainingUses} lượt tham gia
                </li>
                <li className="inline-flex items-center gap-1.5 rounded-full bg-surface-subtle px-3 py-1">
                    <Clock aria-hidden="true" className="size-3.5" />
                    {formatInviteExpiry(invite.expiresAt)}
                </li>
            </ul>

            {errorMessage && (
                <p className="mt-4 text-sm text-feedback-danger" role="alert">
                    {errorMessage}
                </p>
            )}

            <Button
                className="mt-6"
                disabled={isJoining}
                fullWidth
                onClick={onJoin}
            >
                {isJoining ? 'Đang tham gia...' : 'Tham gia server'}
            </Button>
        </div>
    );
}
