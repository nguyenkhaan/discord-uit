import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

import { buttonVariants } from '@/components/common/buttonVariants';

interface InviteStatusMessageProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    actionTo?: string;
}

export function InviteStatusMessage({
    icon: Icon,
    title,
    description,
    actionLabel = 'Về danh sách server',
    actionTo = '/servers',
}: InviteStatusMessageProps) {
    return (
        <div className="flex flex-col items-center text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-surface-subtle text-muted">
                <Icon aria-hidden="true" className="size-7" />
            </span>
            <h1 className="mt-4 text-xl font-extrabold text-heading">
                {title}
            </h1>
            <p className="mt-2 text-body text-foreground-secondary">
                {description}
            </p>
            <Link
                className={buttonVariants({
                    variant: 'secondary',
                    fullWidth: true,
                    className: 'mt-6',
                })}
                to={actionTo}
            >
                {actionLabel}
            </Link>
        </div>
    );
}
