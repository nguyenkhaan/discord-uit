import type { LucideIcon } from 'lucide-react';
import { Archive, Lock, Server, ServerCog } from 'lucide-react';

import { cn } from '@/lib/utils';
import { SERVER_STATUS_META, SERVER_STATUSES } from '@/features/server/server.status';
import type { ServerStatus, ServerStatusCounts } from '@/features/server/server.type';

export interface ServerSummaryProps {
    counts: ServerStatusCounts | undefined;
    isLoading: boolean;
    isError: boolean;
}

type SummaryKey = 'TOTAL' | ServerStatus;

interface SummaryCardConfig {
    title: string;
    icon: LucideIcon;
    iconWrapClass: string;
    iconClass: string;
}

const SUMMARY_CARDS: Record<SummaryKey, SummaryCardConfig> = {
    TOTAL: { title: 'Tổng server', icon: Server, iconWrapClass: 'bg-blue-50', iconClass: 'text-blue-600' },
    ACTIVE: {
        title: `Server ${SERVER_STATUS_META.ACTIVE.label.toLowerCase()}`,
        icon: ServerCog,
        iconWrapClass: 'bg-emerald-50',
        iconClass: 'text-emerald-600',
    },
    LOCKED: {
        title: `Server ${SERVER_STATUS_META.LOCKED.label.toLowerCase()}`,
        icon: Lock,
        iconWrapClass: 'bg-rose-50',
        iconClass: 'text-rose-600',
    },
    CLOSED: {
        title: `Server ${SERVER_STATUS_META.CLOSED.label.toLowerCase()}`,
        icon: Archive,
        iconWrapClass: 'bg-gray-100',
        iconClass: 'text-gray-500',
    },
};

const SUMMARY_ORDER: readonly SummaryKey[] = ['TOTAL', ...SERVER_STATUSES];

function getCount(counts: ServerStatusCounts, key: SummaryKey): number {
    if (key !== 'TOTAL') return counts[key];
    return SERVER_STATUSES.reduce((total, status) => total + counts[status], 0);
}

export const ServerSummary = ({ counts, isLoading, isError }: ServerSummaryProps) => {
    const total = counts ? getCount(counts, 'TOTAL') : 0;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {SUMMARY_ORDER.map((key) => {
                const { title, icon: Icon, iconWrapClass, iconClass } = SUMMARY_CARDS[key];
                const count = counts ? getCount(counts, key) : 0;
                const percent = total > 0 ? Math.round((count / total) * 100) : 0;

                return (
                    <div
                        key={key}
                        className="p-5 bg-white rounded-xl shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] border border-gray-100 flex items-start gap-4"
                    >
                        <div className={cn('p-3 rounded-xl shrink-0', iconWrapClass)}>
                            <Icon className={cn('w-6 h-6', iconClass)} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
                            {isLoading ? (
                                <>
                                    <div className="h-7 w-16 rounded bg-gray-200 animate-pulse mb-2" />
                                    <div className="h-3 w-24 rounded bg-gray-100 animate-pulse" />
                                </>
                            ) : isError || !counts ? (
                                <>
                                    <p className="text-2xl font-bold text-gray-300 mb-2">--</p>
                                    <p className="text-xs text-red-500">Không tải được số liệu</p>
                                </>
                            ) : (
                                <>
                                    <p className="text-2xl font-bold text-gray-900 mb-2">{count.toLocaleString('vi-VN')}</p>
                                    <p className="text-xs text-gray-500">
                                        {key === 'TOTAL' ? 'Tất cả server của bạn' : `${percent}% tổng số server`}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
