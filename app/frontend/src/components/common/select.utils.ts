import type { SelectOption } from '@/components/common/select.types';

export function filterSelectOptions(
    options: SelectOption[],
    query: string
): SelectOption[] {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    if (!normalizedQuery) return options;

    return options.filter((option) =>
        [option.label, option.value, option.description]
            .filter(Boolean)
            .join(' ')
            .toLocaleLowerCase()
            .includes(normalizedQuery)
    );
}

export function toggleSelectValue(
    values: string[],
    value: string,
    disabled = false
): string[] {
    if (disabled) return [...values];

    return values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value];
}

export function getMultiSelectSummary(
    selectedOptions: SelectOption[],
    placeholder: string
): string {
    if (selectedOptions.length === 0) return placeholder;

    const [firstOption] = selectedOptions;
    if (selectedOptions.length === 1) return firstOption.label;

    return `${firstOption.label} +${selectedOptions.length - 1}`;
}
