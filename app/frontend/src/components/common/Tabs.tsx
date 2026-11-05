import type { LucideIcon } from 'lucide-react';
import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';

import { Button } from '@/components/common/Button';
import { cn } from '@/lib/utils';

export interface TabItem<TValue extends string> {
    value: TValue;
    label: string;
    icon?: LucideIcon;
    content: ReactNode;
}

export interface TabsProps<TValue extends string> {
    items: TabItem<TValue>[];
    value: TValue;
    onValueChange: (value: TValue) => void;
    /** Tên mô tả nhóm tab cho trình đọc màn hình */
    label: string;
    className?: string;
}

export function Tabs<TValue extends string>({
    items,
    value,
    onValueChange,
    label,
    className,
}: TabsProps<TValue>) {
    const baseId = useId();
    const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const activeItem = items.find((item) => item.value === value) ?? items[0];

    const tabId = (itemValue: TValue) => `${baseId}-tab-${itemValue}`;
    const panelId = (itemValue: TValue) => `${baseId}-panel-${itemValue}`;

    function focusTab(index: number) {
        const nextIndex = (index + items.length) % items.length;
        tabRefs.current[nextIndex]?.focus();
        onValueChange(items[nextIndex].value);
    }

    function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
        const currentIndex = items.findIndex((item) => item.value === value);
        const keyActions: Record<string, () => void> = {
            ArrowRight: () => focusTab(currentIndex + 1),
            ArrowLeft: () => focusTab(currentIndex - 1),
            Home: () => focusTab(0),
            End: () => focusTab(items.length - 1),
        };
        const action = keyActions[event.key];
        if (!action) return;
        event.preventDefault();
        action();
    }

    return (
        <div className={className}>
            <div
                aria-label={label}
                className="flex gap-1 border-b border-line"
                onKeyDown={handleKeyDown}
                role="tablist"
            >
                {items.map((item, index) => {
                    const isActive = item.value === activeItem.value;
                    const Icon = item.icon;
                    return (
                        <Button
                            aria-controls={panelId(item.value)}
                            aria-selected={isActive}
                            className={cn('flex-1 sm:flex-none')}
                            id={tabId(item.value)}
                            key={item.value}
                            onClick={() => onValueChange(item.value)}
                            ref={(element) => {
                                tabRefs.current[index] = element;
                            }}
                            role="tab"
                            size="compact"
                            tabIndex={isActive ? 0 : -1}
                            variant="tab"
                        >
                            {Icon && (
                                <Icon aria-hidden="true" className="size-4" />
                            )}
                            {item.label}
                        </Button>
                    );
                })}
            </div>

            <div
                aria-labelledby={tabId(activeItem.value)}
                className="pt-4"
                id={panelId(activeItem.value)}
                role="tabpanel"
                tabIndex={0}
            >
                {activeItem.content}
            </div>
        </div>
    );
}
