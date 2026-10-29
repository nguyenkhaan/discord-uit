import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { cn } from '@/lib/utils';

import type { NotificationItem } from '../dashboard.type';
import { RichTextView, SectionCard, toneClasses } from './shared';

export function NotificationsCard({ notifications }: { notifications: NotificationItem[] }) {
    return (
        <SectionCard title={`Thông báo mới (${notifications.length})`} viewAllTo="/notifications">
            <ul className="divide-y divide-line-subtle rounded-xl border border-line-subtle">
                {notifications.map(({ id, message, time, icon: Icon, tone, to }) => (
                    <li key={id}>
                        <Link
                            to={to}
                            className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-focus sm:px-4"
                        >
                            <span className={cn('grid size-9 shrink-0 place-items-center rounded-full', toneClasses[tone])}>
                                <Icon aria-hidden="true" className="size-4.5" />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm text-foreground">
                                    <RichTextView parts={message} />
                                </p>
                                <p className="mt-0.5 text-xs text-muted sm:hidden">{time}</p>
                            </div>
                            <span className="hidden shrink-0 text-xs text-muted sm:block">{time}</span>
                            <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted" />
                        </Link>
                    </li>
                ))}
            </ul>
        </SectionCard>
    );
}