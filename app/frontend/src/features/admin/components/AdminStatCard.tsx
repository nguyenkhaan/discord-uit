import { ArrowDown, ArrowUp } from 'lucide-react';

import { adminIconTileVariants } from '@/features/admin/components/adminVariants';
import type { AdminStat } from '@/features/admin/admin.type';
import { formatAdminNumber } from '@/features/admin/admin.utils';
import { cn } from '@/lib/utils';

export function AdminStatCard({
    title,
    value,
    icon: Icon,
    tone,
    trend,
}: AdminStat) {
    const TrendIcon = trend.direction === 'up' ? ArrowUp : ArrowDown;

    return (
        <article className="flex items-center gap-4 rounded-xl border border-line-subtle bg-surface p-5 shadow-soft">
            <span className={adminIconTileVariants({ tone })}>
                <Icon aria-hidden="true" className="size-7" strokeWidth={2.2} />
            </span>
            <div className="min-w-0">
                <h2 className="text-sm font-medium text-foreground-secondary">
                    {title}
                </h2>
                <p className="mt-1 text-2xl font-bold text-heading tabular-nums">
                    {formatAdminNumber(value)}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-x-1 text-xs text-muted">
                    <span
                        className={cn(
                            'inline-flex items-center gap-0.5 font-semibold',
                            trend.isPositive
                                ? 'text-feedback-success'
                                : 'text-feedback-danger'
                        )}
                    >
                        <TrendIcon
                            aria-hidden="true"
                            className="size-3.5"
                            strokeWidth={2.5}
                        />
                        {trend.value}
                    </span>
                    so với tháng trước
                </p>
            </div>
        </article>
    );
}

export function AdminStatGrid({ stats }: { stats: AdminStat[] }) {
    return (
        <section
            aria-label="Thống kê nhanh"
            className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
            {stats.map((stat) => (
                <AdminStatCard {...stat} key={stat.key} />
            ))}
        </section>
    );
}
