import { CircleCheck, LinkIcon, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Logo } from '@/components/Logo';
import { InviteJoinCard } from '@/features/server/components/InviteJoinCard';
import { InviteStatusMessage } from '@/features/server/components/InviteStatusMessage';
import {
    useInviteLinkDetails,
    useJoinServerByInviteMutation,
} from '@/features/server/server-invite.hooks';
import { getInviteLinkUnavailableReason } from '@/features/server/server-invite.utils';
import { getApiErrorMessage, getApiErrorStatus } from '@/lib/api-error';
import { showToast } from '@/lib/toast';

export default function InviteJoinPage() {
    const { token = '' } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [joinError, setJoinError] = useState('');
    const [isAlreadyMember, setIsAlreadyMember] = useState(false);
    const inviteQuery = useInviteLinkDetails(token);
    const joinServer = useJoinServerByInviteMutation();

    function handleJoin() {
        setJoinError('');
        joinServer.mutate(token, {
            onSuccess: ({ serverName }) => {
                showToast(`Đã tham gia ${serverName || 'server'}.`);
                navigate('/servers', { replace: true });
            },
            onError: (error) => {
                const status = getApiErrorStatus(error);
                if (status === 409) {
                    setIsAlreadyMember(true);
                    return;
                }
                // Link vừa hết hạn / hết lượt: tải lại để hiện đúng lý do
                if (status === 410) void inviteQuery.refetch();
                setJoinError(
                    getApiErrorMessage(
                        error,
                        { 404: 'Server không còn tồn tại.' },
                        'Không thể tham gia server. Vui lòng thử lại.'
                    )
                );
            },
        });
    }

    function renderContent() {
        if (inviteQuery.isPending) {
            return (
                <div aria-busy="true" className="flex flex-col items-center">
                    <div className="size-16 animate-pulse rounded-2xl bg-surface-subtle" />
                    <div className="mt-4 h-4 w-32 animate-pulse rounded bg-surface-subtle" />
                    <div className="mt-2 h-7 w-56 animate-pulse rounded bg-surface-subtle" />
                    <div className="mt-6 h-14 w-full animate-pulse rounded-lg bg-surface-subtle" />
                </div>
            );
        }

        if (inviteQuery.isError) {
            const isNotFound = getApiErrorStatus(inviteQuery.error) === 404;
            return (
                <InviteStatusMessage
                    description={
                        isNotFound
                            ? 'Link có thể đã bị nhập sai. Hãy kiểm tra lại với người đã gửi cho bạn.'
                            : 'Đã có lỗi khi tải lời mời. Vui lòng thử lại sau.'
                    }
                    icon={TriangleAlert}
                    title={
                        isNotFound
                            ? 'Link mời không tồn tại'
                            : 'Không tải được lời mời'
                    }
                />
            );
        }

        if (isAlreadyMember) {
            return (
                <InviteStatusMessage
                    description={`Bạn đã là thành viên của ${inviteQuery.data.serverName || 'server này'}.`}
                    icon={CircleCheck}
                    title="Bạn đã ở trong server"
                />
            );
        }

        const unavailableReason = getInviteLinkUnavailableReason(
            inviteQuery.data
        );
        if (unavailableReason) {
            return (
                <InviteStatusMessage
                    description={`${unavailableReason} Hãy xin chủ server một link mới.`}
                    icon={LinkIcon}
                    title="Link mời không còn hiệu lực"
                />
            );
        }

        return (
            <InviteJoinCard
                errorMessage={joinError}
                invite={inviteQuery.data}
                isJoining={joinServer.isPending}
                onJoin={handleJoin}
            />
        );
    }

    return (
        <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-page px-4 py-10">
            <Logo />
            <section className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-auth-card sm:p-8">
                {renderContent()}
            </section>
        </main>
    );
}
