import type { ReactNode } from 'react';

interface AdminPageHeaderProps {
    title: string;
    description?: string;
    action?: ReactNode;
}

export function AdminPageHeader({
    title,
    description,
    action,
}: AdminPageHeaderProps) {
    return (
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold text-heading sm:text-3xl">
                    {title}
                </h1>
                {description && (
                    <p className="mt-1 text-sm text-foreground-secondary sm:text-base">
                        {description}
                    </p>
                )}
            </div>
            {action}
        </div>
    );
}
