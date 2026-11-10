import { cva } from 'class-variance-authority';

export const adminBadgeVariants = cva(
    'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium',
    {
        variants: {
            tone: {
                info: 'bg-info-subtle text-brand',
                success: 'bg-success-subtle text-feedback-success',
                warning: 'bg-warning-subtle text-feedback-warning',
                danger: 'bg-danger-subtle text-feedback-danger',
                violet: 'bg-violet-subtle text-feedback-violet',
                neutral: 'bg-surface-subtle text-foreground-secondary',
            },
        },
        defaultVariants: { tone: 'neutral' },
    }
);

export const adminDotVariants = cva('size-2 shrink-0 rounded-full', {
    variants: {
        tone: {
            info: 'bg-brand',
            success: 'bg-feedback-success',
            warning: 'bg-feedback-warning-accent',
            danger: 'bg-feedback-danger-border',
            violet: 'bg-feedback-violet',
            neutral: 'bg-subtle',
        },
    },
    defaultVariants: { tone: 'neutral' },
});

export const adminTextToneVariants = cva('', {
    variants: {
        tone: {
            info: 'text-brand',
            success: 'text-feedback-success',
            warning: 'text-feedback-warning',
            danger: 'text-feedback-danger',
            violet: 'text-feedback-violet',
            neutral: 'text-foreground-secondary',
        },
    },
    defaultVariants: { tone: 'neutral' },
});

export const adminIconTileVariants = cva('grid shrink-0 place-items-center', {
    variants: {
        tone: {
            info: 'bg-info-subtle text-brand',
            success: 'bg-success-subtle text-feedback-success',
            warning: 'bg-warning-subtle text-feedback-warning-accent',
            danger: 'bg-danger-subtle text-feedback-danger-border',
            violet: 'bg-violet-subtle text-feedback-violet',
            neutral: 'bg-surface-subtle text-muted',
        },
        shape: {
            circle: 'size-14 rounded-full',
            square: 'size-10 rounded-lg',
        },
    },
    defaultVariants: { tone: 'neutral', shape: 'circle' },
});

/** Ô checkbox dùng trong bảng admin */
export const ADMIN_CHECKBOX_CLASS =
    'size-4 cursor-pointer rounded border-line accent-brand focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus';

export const ADMIN_TH_CLASS =
    'px-3 py-3 text-left text-xs font-semibold whitespace-nowrap text-foreground-secondary';

export const ADMIN_TD_CLASS = 'px-3 py-3 align-middle';
