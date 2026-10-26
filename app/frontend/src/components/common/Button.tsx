import type { VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';

import { buttonVariants } from '@/components/common/buttonVariants';
import { cn } from '@/lib/utils';

export interface ButtonProps
    extends
        ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    function Button(
        {
            className,
            variant,
            size,
            fullWidth,
            type = 'button',
            ...buttonProps
        },
        ref
    ) {
        return (
            <button
                className={cn(
                    buttonVariants({ variant, size, fullWidth }),
                    className
                )}
                ref={ref}
                type={type}
                {...buttonProps}
            />
        );
    }
);
