import type { VariantProps } from 'class-variance-authority';
import type { InputHTMLAttributes, ReactNode } from 'react';

import { inputVariants } from '@/components/common/inputVariants';
import { cn } from '@/lib/utils';

export interface InputProps
    extends
        Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
        Omit<
            VariantProps<typeof inputVariants>,
            'hasStartIcon' | 'hasEndAdornment'
        > {
    endAdornment?: ReactNode;
    startIcon?: ReactNode;
}

export function Input({
    className,
    endAdornment,
    size,
    startIcon,
    status,
    ...inputProps
}: InputProps) {
    return (
        <div className="relative">
            {startIcon && (
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-muted"
                >
                    {startIcon}
                </span>
            )}

            <input
                className={cn(
                    inputVariants({
                        hasEndAdornment: Boolean(endAdornment),
                        hasStartIcon: Boolean(startIcon),
                        size,
                        status,
                    }),
                    className
                )}
                {...inputProps}
            />

            {endAdornment && (
                <span className="absolute inset-y-0 right-1 flex items-center">
                    {endAdornment}
                </span>
            )}
        </div>
    );
}
