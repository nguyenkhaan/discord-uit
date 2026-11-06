import { cva, type VariantProps } from 'class-variance-authority';
import { useState } from 'react';

import { cn } from '@/lib/utils';

const serverAvatarVariants = cva('shrink-0 rounded-lg', {
    variants: {
        size: {
            md: 'size-10 text-base',
            lg: 'size-16 rounded-2xl text-2xl',
        },
    },
    defaultVariants: { size: 'md' },
});

interface ServerAvatarProps extends VariantProps<typeof serverAvatarVariants> {
    name?: string;
    imageUrl?: string;
    className?: string;
}

export function ServerAvatar({
    name,
    imageUrl,
    size,
    className,
}: ServerAvatarProps) {
    const [hasError, setHasError] = useState(false);
    const initial = name?.trim().charAt(0).toUpperCase() || 'S';

    if (imageUrl && !hasError) {
        return (
            <img
                src={imageUrl}
                alt={name ?? 'Ảnh server'}
                loading="lazy"
                onError={() => setHasError(true)}
                className={cn(
                    serverAvatarVariants({ size }),
                    'border border-line-subtle bg-surface-subtle object-cover',
                    className
                )}
            />
        );
    }

    return (
        <div
            aria-hidden="true"
            className={cn(
                serverAvatarVariants({ size }),
                'flex items-center justify-center bg-brand font-bold text-on-brand',
                className
            )}
        >
            {initial}
        </div>
    );
}
