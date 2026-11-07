import { FileText, LogOut, Settings2, UserPlus } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { Button } from '@/components/common/Button';
import { ServerInviteModal } from '@/features/server/components/ServerInviteModal';
import { ServerSharedLinks } from '@/features/server/components/ServerSharedLinks';
import { ServerStatusBadge } from '@/features/server/components/ServerStatusBadge';
import { getServerStatus } from '@/features/server/server.status';
import type { ServerResponse } from '@/features/server/server.type';
import type { SharedChatLink } from '@/features/chat/chat.utils';

interface ServerInfoTabProps {
    server: ServerResponse;
    sharedLinks: SharedChatLink[];
    getSenderName: (userId: string) => string;
}

function InfoSection({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <section className="border-b border-line-subtle pb-4 last:border-b-0">
            <h3 className="mb-2 text-caption font-semibold uppercase tracking-wide text-muted">
                {title}
            </h3>
            {children}
        </section>
    );
}

export function ServerInfoTab({
    server,
    sharedLinks,
    getSenderName,
}: ServerInfoTabProps) {
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const isOwner = server.myRole === 'OWNER';

    return (
        <div className="space-y-4">
            <InfoSection title="Link đã gửi">
                <ServerSharedLinks
                    getSenderName={getSenderName}
                    links={sharedLinks}
                />
            </InfoSection>

            <InfoSection title="File đã gửi">
                <p className="flex items-center gap-2 text-body-sm text-muted">
                    <FileText aria-hidden="true" className="size-4" />
                    Chưa hỗ trợ gửi file trong chat.
                </p>
            </InfoSection>

            {isOwner && (
                <InfoSection title="Link mời">
                    <Button
                        fullWidth
                        onClick={() => setIsInviteOpen(true)}
                        size="compact"
                        variant="secondary"
                    >
                        <UserPlus aria-hidden="true" className="size-4" />
                        Quản lý link mời
                    </Button>
                </InfoSection>
            )}

            {isOwner && (
                <InfoSection title="Trạng thái server">
                    <div className="flex items-center justify-between gap-2">
                        <ServerStatusBadge status={getServerStatus(server)} />
                        <Button size="compact" variant="ghost">
                            <Settings2 aria-hidden="true" className="size-4" />
                            Đổi trạng thái
                        </Button>
                    </div>
                </InfoSection>
            )}

            <InfoSection title="Thành viên">
                <Button
                    className="text-feedback-danger hover:bg-danger-subtle hover:text-feedback-danger"
                    fullWidth
                    size="compact"
                    variant="ghost"
                >
                    <LogOut aria-hidden="true" className="size-4" />
                    Rời server
                </Button>
            </InfoSection>

            <ServerInviteModal
                onClose={() => setIsInviteOpen(false)}
                server={isInviteOpen ? server : null}
            />
        </div>
    );
}
