import { ChevronDown } from 'lucide-react';
import { useId } from 'react';

import type { AdminSelectOption } from '@/features/admin/admin.type';

interface AdminFilterSelectProps<T extends string> {
    label: string;
    value: T;
    options: readonly AdminSelectOption<T>[];
    onChange: (value: T) => void;
}

export function AdminFilterSelect<T extends string>({
    label,
    value,
    options,
    onChange,
}: AdminFilterSelectProps<T>) {
    const id = useId();

    return (
        <div className="flex min-w-36 flex-1 flex-col gap-1 sm:flex-none">
            <label
                className="text-xs font-medium text-foreground-secondary"
                htmlFor={id}
            >
                {label}
            </label>
            <div className="relative">
                <select
                    className="h-11 w-full cursor-pointer appearance-none rounded-lg border border-line bg-surface pr-9 pl-3 text-sm text-foreground transition-colors hover:border-line-brand-hover focus-visible:border-brand focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/20 sm:w-40"
                    id={id}
                    onChange={(event) => {
                        const next = options.find(
                            (option) => option.value === event.target.value
                        );
                        if (next) onChange(next.value);
                    }}
                    value={value}
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <ChevronDown
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted"
                />
            </div>
        </div>
    );
}
