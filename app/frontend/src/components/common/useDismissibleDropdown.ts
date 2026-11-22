import { useEffect, type RefObject } from 'react';

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

        document.addEventListener('pointerdown', handlePointerDown);
        return () =>
            document.removeEventListener('pointerdown', handlePointerDown);
    }, [isOpen, onClose, rootRef]);
}
