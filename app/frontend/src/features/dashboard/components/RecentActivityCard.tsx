import { Bell } from 'lucide-react';

import type { ActivityItem } from '../dashboard.type';
import { PersonAvatar, RichTextView, SectionCard } from './shared';

export function RecentActivityCard({ activities }: { activities: ActivityItem[] }) {
    return (
        <SectionCard title="Hoạt động gần đây" viewAllTo="/notifications">
            <ul className="divide-y divide-line-subtle">
                {activities.map(({ id, actor, message, time, unread }) => (
                    <li key={id} className="flex items-start gap-3 py-3 first:pt-1 last:pb-0">
                        {actor ? (
                            <PersonAvatar name={actor.name} src={actor.avatarUrl} />
                        ) : (
                            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-subtle text-brand">
                                <Bell aria-hidden="true" className="size-5" />
                            </span>
                        )}

                        <div className="min-w-0 flex-1">
                            <p className="text-sm text-foreground">
                                <RichTextView parts={message} />
                            </p>
                            <p className="mt-1 text-xs text-muted">{time}</p>
                        </div>

                        {unread && (
                            <span className="mt-2 size-2 shrink-0 rounded-full bg-brand">
                                <span className="sr-only">Chưa đọc</span>
                            </span>
                        )}
                    </li>
                ))}
            </ul>
        </SectionCard>
    );
}