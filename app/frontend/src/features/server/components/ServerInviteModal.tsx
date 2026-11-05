import { Link2, UserPlus } from 'lucide-react';
import { useState } from 'react';

import { Modal } from '@/components/common/Modal';
import { Tabs } from '@/components/common/Tabs';
import { DirectInviteForm } from '@/features/server/components/DirectInviteForm';
import { InviteLinkTab } from '@/features/server/components/InviteLinkTab';
import type { ServerResponse } from '@/features/server/server.type';

type InviteTab = 'link' | 'direct';

interface ServerInviteModalProps {
    /** Server đang mời; null để đóng modal */
    server: ServerResponse | null;
    onClose: () => void;
}

export function ServerInviteModal({ server, onClose }: ServerInviteModalProps) {
    const [activeTab, setActiveTab] = useState<InviteTab>('link');
    const [createdInviteUrl, setCreatedInviteUrl] = useState<string | null>(
        null
    );
    const serverId = server?.id;

    function handleClose() {
        setActiveTab('link');
        setCreatedInviteUrl(null);
        onClose();
    }

    return (
        <Modal
            description="Tạo link mời hoặc gửi lời mời trực tiếp tới một người dùng."
            isOpen={Boolean(serverId)}
            onClose={handleClose}
            size="lg"
            title={`Mời thành viên vào ${server?.name || 'server'}`}
        >
            {serverId && (
                <Tabs<InviteTab>
                    items={[
                        {
                            value: 'link',
                            label: 'Link mời',
                            icon: Link2,
                            content: (
                                <InviteLinkTab
                                    createdInviteUrl={createdInviteUrl}
                                    onCreated={setCreatedInviteUrl}
                                    serverId={serverId}
                                />
                            ),
                        },
                        {
                            value: 'direct',
                            label: 'Mời trực tiếp',
                            icon: UserPlus,
                            content: <DirectInviteForm serverId={serverId} />,
                        },
                    ]}
                    label="Cách mời thành viên"
                    onValueChange={setActiveTab}
                    value={activeTab}
                />
            )}
        </Modal>
    );
}
