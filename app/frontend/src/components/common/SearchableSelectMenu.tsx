import { Check, Search } from 'lucide-react';
import { useRef, type KeyboardEvent } from 'react';

import { Input } from '@/components/common/Input';
import type { SelectOption } from '@/components/common/select.types';
import { filterSelectOptions } from '@/components/common/select.utils';
import { cn } from '@/lib/utils';

interface SearchableSelectMenuProps {
    emptyMessage: string;
    id: string;
    label: string;
    multiple: boolean;
    onClose: () => void;
    onQueryChange: (query: string) => void;
    onSelect: (option: SelectOption) => void;
    options: SelectOption[];
    query: string;
    selectedValues: string[];
    searchPlaceholder: string;
}

export function SearchableSelectMenu({
    emptyMessage,
    id,
    label,
    multiple,
    onClose,
    onQueryChange,
    onSelect,
    options,
    query,
    selectedValues,
    searchPlaceholder,
}: SearchableSelectMenuProps) {
    const optionRefs = useRef<Record<string, HTMLButtonElement | null>>({});
    const filteredOptions = filterSelectOptions(options, query);
    const selectableOptions = filteredOptions.filter(
        (option) => !option.disabled
    );

    function focusOption(currentValue: string | null, direction: 1 | -1) {
        if (selectableOptions.length === 0) return;

        const currentIndex = currentValue
            ? selectableOptions.findIndex(
                  (option) => option.value === currentValue
              )
            : -1;
        const nextIndex =
            currentIndex < 0
                ? direction === 1
                    ? 0
                    : selectableOptions.length - 1
                : (currentIndex + direction + selectableOptions.length) %
                  selectableOptions.length;

        optionRefs.current[selectableOptions[nextIndex].value]?.focus();
    }

    function handleOptionKeyDown(
        event: KeyboardEvent<HTMLButtonElement>,
        optionValue: string
    ) {
        if (event.key === 'Escape') {
            event.preventDefault();
            onClose();
        } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            focusOption(optionValue, 1);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            focusOption(optionValue, -1);
        } else if (event.key === 'Home') {
            event.preventDefault();
            focusOption(null, 1);
        } else if (event.key === 'End') {
            event.preventDefault();
            focusOption(null, -1);
        }
    }

    return (
        <div
            aria-label={`${label} options`}
            aria-multiselectable={multiple || undefined}
            className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-40 overflow-hidden rounded-xl border border-line bg-surface shadow-card"
            id={id}
            role="listbox"
        >
            <div className="border-b border-line-subtle p-2">
                <Input
                    aria-label={searchPlaceholder}
                    autoComplete="off"
                    autoFocus
                    className="h-10 text-sm"
                    onChange={(event) => onQueryChange(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                            event.preventDefault();
                            onClose();
                        } else if (event.key === 'ArrowDown') {
                            event.preventDefault();
                            focusOption(null, 1);
                        }
                    }}
                    placeholder={searchPlaceholder}
                    startIcon={<Search className="size-4" />}
                    type="search"
                    value={query}
                />
            </div>

            <div className="max-h-64 overflow-y-auto p-1">
                {filteredOptions.length === 0 ? (
                    <p className="px-3 py-6 text-center text-sm text-muted">
                        {emptyMessage}
                    </p>
                ) : (
                    filteredOptions.map((option) => {
                        const selected = selectedValues.includes(option.value);

                        return (
                            <button
                                aria-selected={selected}
                                className={cn(
                                    'flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus',
                                    selected
                                        ? 'bg-brand-subtle text-brand'
                                        : 'text-foreground hover:bg-surface-subtle',
                                    option.disabled &&
                                        'cursor-not-allowed opacity-45'
                                )}
                                disabled={option.disabled}
                                key={option.value}
                                onClick={() => onSelect(option)}
                                onKeyDown={(event) =>
                                    handleOptionKeyDown(event, option.value)
                                }
                                ref={(element) => {
                                    optionRefs.current[option.value] = element;
                                }}
                                role="option"
                                type="button"
                            >
                                <span
                                    className={cn(
                                        'grid size-4 shrink-0 place-items-center rounded border',
                                        multiple
                                            ? selected
                                                ? 'border-brand bg-brand text-on-brand'
                                                : 'border-line'
                                            : 'border-transparent'
                                    )}
                                >
                                    {selected && (
                                        <Check
                                            aria-hidden="true"
                                            className="size-3"
                                        />
                                    )}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate font-medium">
                                        {option.label}
                                    </span>
                                    {option.description && (
                                        <span className="mt-0.5 block truncate text-xs text-muted">
                                            {option.description}
                                        </span>
                                    )}
                                </span>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}
