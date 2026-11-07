import { cva } from 'class-variance-authority';

/** Kiểu bong bóng tin nhắn */
export const chatBubbleVariants = cva(
    'max-w-full break-words rounded-2xl px-3 py-2 text-body',
    {
        variants: {
            tone: {
                own: 'rounded-br-md bg-brand text-on-brand',
                other: 'rounded-bl-md bg-surface-subtle text-foreground',
                deleted: 'border border-line bg-transparent italic text-muted',
            },
        },
        defaultVariants: { tone: 'other' },
    }
);
