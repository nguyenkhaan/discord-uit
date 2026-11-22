import { ChevronDown } from 'lucide-react';
import { useId, useRef, useState } from 'react';

import { SearchableSelectMenu } from '@/components/common/SearchableSelectMenu';
import type { SelectOption } from '@/components/common/select.types';
import {
    getDropdownStateAfterTriggerClick,
    getMultiSelectSummary,
    toggleSelectValue,
} from '@/components/common/select.utils';
import { useDismissibleDropdown } from '@/components/common/useDismissibleDropdown';
import { cn } from '@/lib/utils';

export interface MultiSelectBoxProps {
    'aria-label'?: string;
    className?: string;
    disabled?: boolean;
    emptyMessage?: string;
    id?: string;
    label?: string;
    onChange: (values: string[]) => void;
    options: SelectOption[];
    placeholder?: string;
    searchPlaceholder?: string;
    value: string[];
}

export function MultiSelectBox({
    'aria-label': ariaLabel,
    className,
    disabled = false,
    emptyMessage = 'Không tìm thấy lựa chọn.',
    id,
    label,
    onChange,
    options,
    placeholder = 'Chọn nhiều lựa chọn',
    searchPlaceholder = 'Tìm kiếm lựa chọn...',
    value,
}: MultiSelectBoxProps) {
    const generatedId = useId().replaceAll(':', '');
    const controlId = id ?? `multi-select-box-${generatedId}`;
    const labelId = `${controlId}-label`;
    const menuId = `${controlId}-menu`;
    const rootRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const selectedOptions = options.filter((option) =>
        value.includes(option.value)
    );
    const summary = getMultiSelectSummary(selectedOptions, placeholder);

    useDismissibleDropdown(rootRef, isOpen, () => setIsOpen(false));

    function handleSelect(option: SelectOption) {
        onChange(toggleSelectValue(value, option.value, option.disabled));
    }

    return (
        <div className={cn('relative min-w-0', className)} ref={rootRef}>
            {label && (
                <label
                    className="mb-2 block text-sm font-semibold text-heading"
                    htmlFor={controlId}
                    id={labelId}
                >
                    {label}
                </label>
            )}
            <button
                aria-controls={menuId}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-label={label ? undefined : (ariaLabel ?? placeholder)}
                aria-labelledby={label ? labelId : undefined}
                className={cn(
                    'flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-line bg-transparent px-3.5 text-left text-sm transition-[border-color,box-shadow] hover:border-line-brand-hover focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-60',
                    isOpen && 'border-brand shadow-focus',
                    value.length === 0 && 'text-muted'
                )}
                disabled={disabled}
                id={controlId}
                onClick={() =>
                    setIsOpen(getDropdownStateAfterTriggerClick(isOpen))
                }
                onKeyDown={(event) => {
                    if (event.key === 'Escape' && isOpen) {
                        event.preventDefault();
                        setIsOpen(false);
                    } else if (
                        !isOpen &&
                        (event.key === 'ArrowDown' ||
                            event.key === 'Enter' ||
                            event.key === ' ')
                    ) {
                        event.preventDefault();
                        setIsOpen(true);
                    }
                }}
                type="button"
            >
                <span className="min-w-0 truncate">{summary}</span>
                <ChevronDown
                    aria-hidden="true"
                    className={cn(
                        'size-4 shrink-0 text-muted transition-transform',
                        isOpen && 'rotate-180'
                    )}
                />
            </button>

            {isOpen && (
                <SearchableSelectMenu
                    emptyMessage={emptyMessage}
                    id={menuId}
                    label={label ?? ariaLabel ?? placeholder}
                    multiple
                    onClose={() => setIsOpen(false)}
                    onQueryChange={setQuery}
                    onSelect={handleSelect}
                    options={options}
                    query={query}
                    selectedValues={value}
                    searchPlaceholder={searchPlaceholder}
                />
            )}
        </div>
    );
}
