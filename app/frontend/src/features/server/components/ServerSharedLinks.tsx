import { ExternalLink } from 'lucide-react';

import type { SharedChatLink } from '@/features/chat/chat.utils';
import { formatChatTime } from '@/features/chat/chat.utils';

interface ServerSharedLinksProps {
    links: SharedChatLink[];
    getSenderName: (userId: string) => string;
}

export function ServerSharedLinks({
    links,
    getSenderName,
}: ServerSharedLinksProps) {
    if (links.length === 0) {
        return (
            <p className="text-body-sm text-muted">
                Chưa có link nào trong các tin nhắn đã tải.
            </p>
        );
    }

    return (
        <ul className="space-y-1">
            {links.map((link) => (
                <li key={link.url}>
                    <a
                        className="group flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                        href={link.url}
                        rel="noopener noreferrer"
                        target="_blank"
                    >
                        <ExternalLink
                            aria-hidden="true"
                            className="mt-0.5 size-4 shrink-0 text-brand"
                        />
                        <span className="min-w-0">
                            <span className="block truncate text-sm text-brand group-hover:underline">
                                {link.url}
                            </span>
                            <span className="block text-caption text-muted">
                                {getSenderName(link.senderUserId)} ·{' '}
                                {formatChatTime(link.createdAt)}
                            </span>
                        </span>
                    </a>
                </li>
            ))}
        </ul>
    );
}
