import { useEffect, type RefObject } from 'react';

import { shouldCloseDropdownOnFocusChange } from '@/components/common/select.utils';

export function useDismissibleDropdown(
    rootRef: RefObject<HTMLDivElement | null>,
    isOpen: boolean,
    onClose: () => void
) {
    useEffect(() => {
        if (!isOpen) return;

        function handlePointerDown(event: PointerEvent) {
            if (!rootRef.current?.contains(event.target as Node)) {
                onClose();
            }
        }

        function handleFocusIn(event: FocusEvent) {
            const isFocusWithinRoot = Boolean(
                rootRef.current?.contains(event.target as Node)
            );
            if (shouldCloseDropdownOnFocusChange(isFocusWithinRoot)) {
                onClose();
            }
        }

        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('focusin', handleFocusIn);
        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('focusin', handleFocusIn);
        };
    }, [isOpen, onClose, rootRef]);
}
