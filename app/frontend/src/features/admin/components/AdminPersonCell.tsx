import { adminIconTileVariants } from '@/features/admin/components/adminVariants';
import type { AdminTone } from '@/features/admin/admin.type';
import { cn } from '@/lib/utils';

const AVATAR_TONES: AdminTone[] = [
    'info',
    'success',
    'warning',
    'violet',
    'danger',
];

/** Chọn màu avatar ổn định theo tên để cùng một người luôn có cùng màu */
function getAvatarTone(name: string): AdminTone {
    const hash = [...name].reduce(
        (total, char) => total + char.charCodeAt(0),
        0
    );
    return AVATAR_TONES[hash % AVATAR_TONES.length];
}

function getInitials(name: string): string {
    const words = name.trim().split(/\s+/);
    const letters =
        words.length > 1 ? [words[0], words[words.length - 1]] : [words[0]];
    return letters
        .map((word) => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

interface AdminAvatarProps {
    name: string;
    className?: string;
}

export function AdminAvatar({ name, className }: AdminAvatarProps) {
    return (
        <span
            aria-hidden="true"
            className={cn(
                adminIconTileVariants({ tone: getAvatarTone(name) }),
                'size-9 rounded-full text-xs font-bold',
                className
            )}
        >
            {getInitials(name)}
        </span>
    );
}

interface AdminPersonCellProps {
    name: string;
    subtitle?: string;
}

export function AdminPersonCell({ name, subtitle }: AdminPersonCellProps) {
    return (
        <div className="flex min-w-0 items-center gap-3">
            <AdminAvatar name={name} />
            <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                    {name}
                </p>
                {subtitle && (
                    <p className="truncate text-xs text-muted">{subtitle}</p>
                )}
            </div>
        </div>
    );
}
