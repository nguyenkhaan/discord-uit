import { Info, Users, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/common/Button';
import { Tabs } from '@/components/common/Tabs';
import { ServerInfoTab } from '@/features/server/components/ServerInfoTab';
import { ServerMembersTab } from '@/features/server/components/ServerMembersTab';
import type {
    ServerMemberResponse,
    ServerResponse,
} from '@/features/server/server.type';
import type { SharedChatLink } from '@/features/chat/chat.utils';

type SidePanelTab = 'members' | 'info';

interface ServerSidePanelProps {
    server: ServerResponse;
    members: ServerMemberResponse[];
    isMembersLoading: boolean;
    isMembersError: boolean;
    onRetryMembers: () => void;
    currentUserId?: string;
    sharedLinks: SharedChatLink[];
    getSenderName: (userId: string) => string;
    /** Đóng panel trên màn hình nhỏ */
    onClose: () => void;
}

export function ServerSidePanel({
    server,
    members,
    isMembersLoading,
    isMembersError,
    onRetryMembers,
    currentUserId,
    sharedLinks,
    getSenderName,
    onClose,
}: ServerSidePanelProps) {
    const [activeTab, setActiveTab] = useState<SidePanelTab>('members');

    return (
        <aside
            aria-label="Thông tin server"
            className="flex h-full w-full flex-col overflow-hidden bg-surface"
        >
            <div className="flex items-center justify-end px-2 pt-2 lg:hidden">
                <Button
                    aria-label="Đóng bảng thông tin"
                    className="size-9 min-h-9"
                    onClick={onClose}
                    size="icon"
                    variant="ghost"
                >
                    <X aria-hidden="true" className="size-5" />
                </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 lg:pt-3">
                <Tabs<SidePanelTab>
                    items={[
                        {
                            value: 'members',
                            label: 'Thành viên',
                            icon: Users,
                            content: (
                                <ServerMembersTab
                                    canManage={server.myRole === 'OWNER'}
                                    currentUserId={currentUserId}
                                    isError={isMembersError}
                                    isLoading={isMembersLoading}
                                    members={members}
                                    onRetry={onRetryMembers}
                                />
                            ),
                        },
                        {
                            value: 'info',
                            label: 'Thông tin',
                            icon: Info,
                            content: (
                                <ServerInfoTab
                                    getSenderName={getSenderName}
                                    server={server}
                                    sharedLinks={sharedLinks}
                                />
                            ),
                        },
                    ]}
                    label="Thông tin server"
                    onValueChange={setActiveTab}
                    value={activeTab}
                />
            </div>
        </aside>
    );
}
