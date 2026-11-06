import { CreatedInviteLinkNotice } from '@/features/server/components/CreatedInviteLinkNotice';
import { InviteLinkCreateForm } from '@/features/server/components/InviteLinkCreateForm';
import { InviteLinkList } from '@/features/server/components/InviteLinkList';
import { useInviteLinks } from '@/features/server/server-invite.hooks';
import { getRedeemableInviteLinks } from '@/features/server/server-invite.utils';

interface InviteLinkTabProps {
    serverId: string;
    /** Giữ ở component cha để không mất link vừa tạo khi chuyển tab */
    createdInviteUrl: string | null;
    onCreated: (inviteUrl: string) => void;
}

export function InviteLinkTab({
    serverId,
    createdInviteUrl,
    onCreated,
}: InviteLinkTabProps) {
    const { data, isLoading, isError, refetch } = useInviteLinks(serverId);
    const activeLinks = getRedeemableInviteLinks(data ?? []);

    return (
        <div className="space-y-5">
            <InviteLinkCreateForm
                activeLinkCount={activeLinks.length}
                onCreated={onCreated}
                serverId={serverId}
            />

            {createdInviteUrl && (
                <CreatedInviteLinkNotice inviteUrl={createdInviteUrl} />
            )}

            <InviteLinkList
                isError={isError}
                isLoading={isLoading}
                links={activeLinks}
                onRetry={() => void refetch()}
                serverId={serverId}
            />
        </div>
    );
}
