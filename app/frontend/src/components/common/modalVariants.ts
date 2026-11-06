import { cva } from 'class-variance-authority';

export const modalPanelVariants = cva(
    'relative flex max-h-[calc(100svh-2rem)] w-full flex-col overflow-hidden rounded-2xl bg-surface shadow-auth-card',
    {
        variants: {
            size: {
                sm: 'max-w-md',
                md: 'max-w-lg',
                lg: 'max-w-2xl',
            },
        },
        defaultVariants: {
            size: 'md',
        },
    }
);
