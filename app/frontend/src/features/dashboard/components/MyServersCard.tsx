import { PhoneCall, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

import { cn } from '@/lib/utils';

import type { ServerSummary } from '../dashboard.type';
import { SectionCard } from './shared';

export function MyServersCard({ servers }: { servers: ServerSummary[] }) {
    return (
        <SectionCard title="Server của tôi" viewAllTo="/servers">
            <ul className="space-y-2">
                {servers.map(({ id, name, memberCount, status, icon: Icon, iconClassName, imageUrl }) => (
                    <li key={id}>
                        <Link
                            to={`/servers/${id}`}
                            className="flex items-center gap-3 rounded-xl border border-line-subtle p-2 transition-colors hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                        >
                            {imageUrl ? (
                                <img src={imageUrl} alt="" className="size-12 shrink-0 rounded-lg object-cover" />
                            ) : (
                                <span className={cn('grid size-12 shrink-0 place-items-center rounded-lg', iconClassName)}>
                                    <Icon aria-hidden="true" className="size-6" />
                                </span>
                            )}

                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-heading">{name}</p>
                                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                                    <Users aria-hidden="true" className="size-3.5" />
                                    {memberCount} thành viên
                                </p>
                            </div>

                            {status === 'calling' ? (
                                <span className="mr-1 inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                    <PhoneCall aria-hidden="true" className="size-3.5" />
                                    Đang gọi
                                </span>
                            ) : (
                                <span className="mr-1 shrink-0 rounded-full bg-surface-subtle px-2.5 py-1 text-xs font-medium text-foreground-secondary">
                                    Hoạt động
                                </span>
                            )}
                        </Link>
                    </li>
                ))}
            </ul>
        </SectionCard>
    );
}