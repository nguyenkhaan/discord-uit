import type { ReactNode } from 'react';

import {
    adminBadgeVariants,
    adminDotVariants,
    adminTextToneVariants,
} from '@/features/admin/components/adminVariants';
import type { AdminTone } from '@/features/admin/admin.type';
import { cn } from '@/lib/utils';

interface AdminBadgeProps {
    tone: AdminTone;
    children: ReactNode;
    /** Hiện chấm màu trước nhãn, dùng cho badge trạng thái */
    withDot?: boolean;
    className?: string;
}

export function AdminBadge({
    tone,
    children,
    withDot = false,
    className,
}: AdminBadgeProps) {
    return (
        <span className={cn(adminBadgeVariants({ tone }), className)}>
            {withDot && (
                <span
                    aria-hidden="true"
                    className={adminDotVariants({ tone })}
                />
            )}
            {children}
        </span>
    );
}

interface AdminStatusTextProps {
    tone: AdminTone;
    children: ReactNode;
    className?: string;
}

/** Trạng thái dạng chấm màu + chữ cùng tông, không chỉ dựa vào màu */
export function AdminStatusText({
    tone,
    children,
    className,
}: AdminStatusTextProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-2 whitespace-nowrap text-sm',
                adminTextToneVariants({ tone }),
                className
            )}
        >
            <span aria-hidden="true" className={adminDotVariants({ tone })} />
            {children}
        </span>
    );
}
