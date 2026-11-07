import { SERVER_STATUS_META } from '@/features/server/server.status';
import type { ServerStatus } from '@/features/server/server.type';
import { cn } from '@/lib/utils';

interface ServerStatusBadgeProps {
    status: ServerStatus;
    className?: string;
}

export function ServerStatusBadge({
    status,
    className,
}: ServerStatusBadgeProps) {
    const meta = SERVER_STATUS_META[status];
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset',
                meta.badgeClass,
                className
            )}
        >
            <span className={cn('size-1.5 rounded-full', meta.dotClass)} />
            {meta.label}
        </span>
    );
}
