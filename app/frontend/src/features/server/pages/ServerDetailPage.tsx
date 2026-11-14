import { ServerOff } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import { useAuth } from '@/context/useAuth';
import { ChatPanel } from '@/features/chat/components/ChatPanel';
import { useServerChat } from '@/features/chat/chat.hooks';
import { extractSharedLinks } from '@/features/chat/chat.utils';
import { InviteStatusMessage } from '@/features/server/components/InviteStatusMessage';
import { ServerDetailHeader } from '@/features/server/components/ServerDetailHeader';
import { ServerSidePanel } from '@/features/server/components/ServerSidePanel';
import { useServerMembers } from '@/features/server/server-member.hooks';
import { useServer } from '@/features/server/server.hooks';
import { getServerStatus } from '@/features/server/server.status';
import type { ServerStatus } from '@/features/server/server.type';
import { cn } from '@/lib/utils';

const LOCKED_REASONS: Partial<Record<ServerStatus, string>> = {
    LOCKED: 'Server đã bị khóa, tạm thời không thể gửi tin nhắn.',
    CLOSED: 'Server đã đóng, không thể gửi tin nhắn.',
};

const UNKNOWN_SENDER = 'Thành viên đã rời';

export default function ServerDetailPage() {
    const { serverId = '' } = useParams<{ serverId: string }>();
    const { user } = useAuth();
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    const serverQuery = useServer(serverId);
    const membersQuery = useServerMembers(serverId);
    const chat = useServerChat(serverId, user?.id);

    const memberNames = useMemo(() => {
        const names = new Map<string, string>();
        membersQuery.data?.forEach((member) => {
            if (member.userId)
                names.set(member.userId, member.fullName || 'Chưa đặt tên');
        });
        return names;
    }, [membersQuery.data]);

    const getSenderName = useCallback(
        (userId: string) =>
            memberNames.get(userId) ??
            (userId === user?.id ? user.fullName : UNKNOWN_SENDER),
        [memberNames, user]
    );

    const sharedLinks = useMemo(
        () => extractSharedLinks(chat.messages),
        [chat.messages]
    );

    if (serverQuery.isPending) {
        return (
            <div
                aria-busy="true"
                className="h-[calc(100svh-4rem)] animate-pulse bg-surface"
            />
        );
    }

    if (serverQuery.isError) {
        return (
            <div className="mx-auto mt-10 max-w-md rounded-2xl bg-surface p-8 shadow-auth-card">
                <InviteStatusMessage
                    description="Server có thể đã bị xóa, hoặc bạn không còn là thành viên."
                    icon={ServerOff}
                    title="Không mở được server"
                />
            </div>
        );
    }

    const server = serverQuery.data;

    return (
        <div className="flex h-[calc(100svh-4rem)] flex-col overflow-hidden bg-surface">
            <ServerDetailHeader
                isPanelOpen={isPanelOpen}
                onTogglePanel={() => setIsPanelOpen((open) => !open)}
                server={server}
            />

            <div className="relative flex min-h-0 flex-1">
                {/* Đổi server thì tạo lại khung chat, bỏ tin đang trả lời */}
                <ChatPanel
                    chat={chat}
                    key={serverId}
                    currentUserId={user?.id}
                    getSenderName={getSenderName}
                    lockedReason={LOCKED_REASONS[getServerStatus(server)]}
                    serverName={server.name}
                />

                {isPanelOpen && (
                    <div
                        aria-hidden="true"
                        className="absolute inset-0 z-10 bg-heading/30 lg:hidden"
                        onClick={() => setIsPanelOpen(false)}
                    />
                )}
                <div
                    className={cn(
                        'border-l border-line-subtle',
                        'absolute inset-y-0 right-0 z-20 w-full max-w-sm shadow-auth-card lg:static lg:z-auto lg:block lg:w-80 lg:shadow-none',
                        isPanelOpen ? 'block' : 'hidden'
                    )}
                >
                    <ServerSidePanel
                        currentUserId={user?.id}
                        getSenderName={getSenderName}
                        isMembersError={membersQuery.isError}
                        isMembersLoading={membersQuery.isPending}
                        members={membersQuery.data ?? []}
                        onClose={() => setIsPanelOpen(false)}
                        onRetryMembers={() => void membersQuery.refetch()}
                        server={server}
                        sharedLinks={sharedLinks}
                    />
                </div>
            </div>
        </div>
    );
}
