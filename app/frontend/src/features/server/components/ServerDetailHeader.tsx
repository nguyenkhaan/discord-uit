import { ArrowLeft, PanelRight, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/common/Button';
import { ServerAvatar } from '@/features/server/components/ServerAvatar';
import { ServerStatusBadge } from '@/features/server/components/ServerStatusBadge';
import { getServerStatus } from '@/features/server/server.status';
import type { ServerResponse } from '@/features/server/server.type';

interface ServerDetailHeaderProps {
    server: ServerResponse;
    isPanelOpen: boolean;
    onTogglePanel: () => void;
}

export function ServerDetailHeader({
    server,
    isPanelOpen,
    onTogglePanel,
}: ServerDetailHeaderProps) {
    return (
        <header className="flex items-center gap-3 border-b border-line-subtle px-3 py-3 sm:px-4">
            <Link
                aria-label="Quay lại danh sách server"
                className="grid size-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-brand-subtle hover:text-brand focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                to="/servers"
            >
                <ArrowLeft aria-hidden="true" className="size-5" />
            </Link>
            <ServerAvatar imageUrl={server.groupImageUrl} name={server.name} />
            <div className="min-w-0 flex-1">
                <h1 className="truncate text-base font-bold text-heading sm:text-lg">
                    {server.name || 'Server chưa đặt tên'}
                </h1>
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-muted">
                    <span className="inline-flex items-center gap-1 whitespace-nowrap">
                        <Users aria-hidden="true" className="size-3.5" />
                        {server.memberCount ?? 0} thành viên
                    </span>
                    <ServerStatusBadge
                        className="px-1.5 py-0.5"
                        status={getServerStatus(server)}
                    />
                </p>
            </div>
            <Button
                aria-expanded={isPanelOpen}
                aria-label="Mở bảng thành viên và thông tin"
                className="size-9 min-h-9 lg:hidden"
                onClick={onTogglePanel}
                size="icon"
                variant="ghost"
            >
                <PanelRight aria-hidden="true" className="size-5" />
            </Button>
        </header>
    );
}
