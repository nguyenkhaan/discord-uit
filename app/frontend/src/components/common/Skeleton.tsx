import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export function Skeleton({
    className,
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            {...props}
            aria-hidden="true"
            className={cn(
                'animate-pulse rounded-md bg-surface-subtle motion-reduce:animate-none',
                className
            )}
        />
    );
}
