import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { cn } from '@/lib/utils';

import type { QuickLink } from '../dashboard.type';
import { toneClasses } from './shared';

export function QuickLinkCard({ title, description, to, icon: Icon, tone }: QuickLink) {
    return (
        <Link
            to={to}
            className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-brand/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus sm:p-5"
        >
            <span className={cn('grid size-14 shrink-0 place-items-center rounded-xl', toneClasses[tone])}>
                <Icon aria-hidden="true" className="size-7" />
            </span>
            <div className="min-w-0 flex-1">
                <p className="font-semibold text-heading">{title}</p>
                <p className="mt-1 text-sm text-foreground-secondary">{description}</p>
            </div>
            <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted" />
        </Link>
    );
}