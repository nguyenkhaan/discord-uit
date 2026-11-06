import { Check, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/common/Button';
import { showToast } from '@/lib/toast';

const COPIED_RESET_MS = 2000;

export interface CopyButtonProps {
    value: string;
    label?: string;
    className?: string;
}

export function CopyButton({
    value,
    label = 'Sao chép',
    className,
}: CopyButtonProps) {
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        if (!isCopied) return;
        const timer = window.setTimeout(
            () => setIsCopied(false),
            COPIED_RESET_MS
        );
        return () => window.clearTimeout(timer);
    }, [isCopied]);

    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(value);
            setIsCopied(true);
        } catch {
            showToast('Không thể sao chép. Hãy chọn và sao chép thủ công.');
        }
    }

    return (
        <Button
            aria-live="polite"
            className={className}
            onClick={handleCopy}
            size="compact"
            variant="secondary"
        >
            {isCopied ? (
                <Check aria-hidden="true" className="size-4" />
            ) : (
                <Copy aria-hidden="true" className="size-4" />
            )}
            {isCopied ? 'Đã sao chép' : label}
        </Button>
    );
}
