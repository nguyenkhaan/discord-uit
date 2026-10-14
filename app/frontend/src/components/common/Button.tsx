import type { VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';

import { buttonVariants } from '@/components/common/buttonVariants';
import { cn } from '@/lib/utils';

export interface ButtonProps
    extends
        ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {}

export function Button({
    className,
    variant,
    size,
    fullWidth,
    type = 'button',
    ...buttonProps
}: ButtonProps) {
    return (
        <button
            className={cn(
                buttonVariants({ variant, size, fullWidth }),
                className
            )}
            type={type}
            {...buttonProps}
        />
    );
}
