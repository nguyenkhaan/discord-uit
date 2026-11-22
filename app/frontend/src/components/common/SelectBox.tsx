import { ChevronDown } from 'lucide-react';
import { useId, useRef, useState } from 'react';

import { SearchableSelectMenu } from '@/components/common/SearchableSelectMenu';
import type { SelectOption } from '@/components/common/select.types';
import { getDropdownStateAfterTriggerClick } from '@/components/common/select.utils';
import { useDismissibleDropdown } from '@/components/common/useDismissibleDropdown';
import { cn } from '@/lib/utils';

export interface SelectBoxProps {
    'aria-label'?: string;
    className?: string;
    disabled?: boolean;
    emptyMessage?: string;
    id?: string;
    label?: string;
    onChange: (value: string | null) => void;
    options: SelectOption[];
    placeholder?: string;
    searchPlaceholder?: string;
    value: string | null;
}

export function SelectBox({
    'aria-label': ariaLabel,
    className,
    disabled = false,
    emptyMessage = 'Không tìm thấy lựa chọn.',
    id,
    label,
    onChange,
    options,
    placeholder = 'Chọn một lựa chọn',
    searchPlaceholder = 'Tìm kiếm lựa chọn...',
    value,
}: SelectBoxProps) {
    const generatedId = useId().replaceAll(':', '');
    const controlId = id ?? `select-box-${generatedId}`;
    const labelId = `${controlId}-label`;
    const menuId = `${controlId}-menu`;
    const rootRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const selectedOption = options.find((option) => option.value === value);

    useDismissibleDropdown(rootRef, isOpen, () => setIsOpen(false));

    function handleSelect(option: SelectOption) {
        if (option.disabled) return;

        onChange(option.value);
        setQuery('');
        setIsOpen(false);
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
                    !selectedOption && 'text-muted'
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
                <span className="min-w-0 truncate">
                    {selectedOption?.label ?? placeholder}
                </span>
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
                    multiple={false}
                    onClose={() => setIsOpen(false)}
                    onQueryChange={setQuery}
                    onSelect={handleSelect}
                    options={options}
                    query={query}
                    selectedValues={value !== null ? [value] : []}
                    searchPlaceholder={searchPlaceholder}
                />
            )}
        </div>
    );
}
