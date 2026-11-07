interface ChatDayDividerProps {
    label: string;
}

export function ChatDayDivider({ label }: ChatDayDividerProps) {
    return (
        <div className="my-3 flex items-center gap-3" role="separator">
            <span className="h-px flex-1 bg-line-subtle" />
            <span className="text-caption font-semibold text-muted">
                {label}
            </span>
            <span className="h-px flex-1 bg-line-subtle" />
        </div>
    );
}
