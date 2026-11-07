import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const userAvatarVariants = cva(
    'grid shrink-0 place-items-center rounded-full font-bold select-none',
    {
        variants: {
            size: {
                sm: 'size-8 text-xs',
                md: 'size-10 text-sm',
            },
            tone: {
                brand: 'bg-brand text-on-brand',
                subtle: 'bg-brand-subtle text-brand',
            },
        },
        defaultVariants: { size: 'md', tone: 'subtle' },
    }
);

export interface UserAvatarProps extends VariantProps<
    typeof userAvatarVariants
> {
    name?: string;
    className?: string;
}

/** Avatar hiển thị chữ cái đầu của tên */
export function UserAvatar({ name, size, tone, className }: UserAvatarProps) {
    const initial = name?.trim().charAt(0).toUpperCase() || '?';
    return (
        <span
            aria-hidden="true"
            className={cn(userAvatarVariants({ size, tone }), className)}
        >
            {initial}
        </span>
    );
}
