import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 rounded-lg border text-center font-bold no-underline transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60',
    {
        variants: {
            variant: {
                primary:
                    'border-transparent bg-brand text-on-brand shadow-auth-action hover:bg-brand-active',
                secondary:
                    'border-line-brand bg-surface text-brand hover:bg-brand-subtle',
                ghost: 'border-transparent bg-transparent text-muted shadow-none hover:bg-brand-subtle hover:text-brand',
                tab: '-mb-px rounded-none border-x-0 border-t-0 border-b-2 border-transparent bg-transparent px-3 font-normal text-muted shadow-none hover:text-brand aria-selected:border-brand aria-selected:font-bold aria-selected:text-brand',
            },
            size: {
                compact: 'min-h-11 px-3 text-sm',
                default: 'min-h-14 px-4 text-base',
                tab: 'min-h-12 px-3 text-base lg:text-[1.08rem]',
                icon: 'size-11 min-h-11 p-0',
            },
            fullWidth: {
                true: 'w-full',
                false: 'w-auto',
            },
        },
        defaultVariants: {
            variant: 'primary',
            size: 'default',
            fullWidth: false,
        },
    }
);
