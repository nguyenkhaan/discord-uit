import { Clock, Link2, Trash2, Users } from 'lucide-react';

import { Button } from '@/components/common/Button';
import { formatInviteExpiry } from '@/features/server/server-invite.utils';
import type { InviteLinkResponse } from '@/features/server/server.type';

interface InviteLinkItemProps {
    link: InviteLinkResponse;
    position: number;
    onRevoke: (link: InviteLinkResponse) => void;
}

export function InviteLinkItem({
    link,
    position,
    onRevoke,
}: InviteLinkItemProps) {
    return (
        <li className="flex items-center gap-3 rounded-xl border border-line-subtle bg-surface px-3 py-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-subtle text-brand">
                <Link2 aria-hidden="true" className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-heading">
                    Link mời #{position}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-caption text-muted">
                    <span className="inline-flex items-center gap-1">
                        <Users aria-hidden="true" className="size-3.5" />
                        {link.useCount ?? 0}/{link.maxUses ?? 0} lượt
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <Clock aria-hidden="true" className="size-3.5" />
                        {formatInviteExpiry(link.expiresAt)}
                    </span>
                </p>
            </div>
            <Button
                aria-label={`Thu hồi link mời #${position}`}
                className="size-9 min-h-9 text-muted hover:bg-danger-subtle hover:text-feedback-danger"
                onClick={() => onRevoke(link)}
                size="icon"
                title="Thu hồi link"
                variant="ghost"
            >
                <Trash2 aria-hidden="true" className="size-4" />
            </Button>
        </li>
    );
}
