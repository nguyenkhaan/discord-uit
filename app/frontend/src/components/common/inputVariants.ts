import { cva } from "class-variance-authority";

export const inputVariants = cva(
  "block w-full rounded-lg border bg-surface text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-placeholder disabled:cursor-not-allowed disabled:opacity-60 focus:ring-3 focus:ring-offset-0",
  {
    variants: {
      status: {
        default: "border-line focus:border-brand focus:ring-focus/20",
        error:
          "border-feedback-danger-border focus:border-feedback-danger-border focus:ring-feedback-danger-border/15",
      },
      size: {
        compact: "h-12 text-sm",
        default: "h-14 text-base lg:text-[1.08rem]",
      },
      hasStartIcon: {
        true: "pl-12",
        false: "pl-4",
      },
      hasEndAdornment: {
        true: "pr-12",
        false: "pr-4",
      },
    },
    defaultVariants: {
      status: "default",
      size: "default",
      hasStartIcon: false,
      hasEndAdornment: false,
    },
  },
);
