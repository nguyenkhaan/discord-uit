import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';

import { Logo } from '@/components/Logo';
import { PENDING_REPORT_COUNT } from '@/features/admin/admin.mock';
import { adminNavigationItems } from '@/features/admin/admin.navigation';
import { cn } from '@/lib/utils';

interface AdminSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const BADGE_VALUES = { pendingReports: PENDING_REPORT_COUNT } as const;

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        const focusFrame = requestAnimationFrame(() =>
            closeButtonRef.current?.focus()
        );
        function closeOnEscape(event: KeyboardEvent) {
            if (event.key === 'Escape') onClose();
        }
        document.addEventListener('keydown', closeOnEscape);

        return () => {
            cancelAnimationFrame(focusFrame);
            document.removeEventListener('keydown', closeOnEscape);
            requestAnimationFrame(() =>
                document.getElementById('admin-menu-trigger')?.focus()
            );
        };
    }, [isOpen, onClose]);

    return (
        <>
            {isOpen && (
                <button
                    aria-label="Đóng menu quản trị"
                    className="fixed inset-0 z-40 cursor-pointer bg-heading/30 lg:hidden"
                    onClick={onClose}
                    type="button"
                />
            )}

            <aside
                className={cn(
                    'invisible fixed inset-y-0 left-0 z-50 flex w-64 -translate-x-full flex-col border-r border-line-subtle bg-surface-subtle transition-transform duration-200 ease-out motion-reduce:transition-none lg:visible lg:translate-x-0',
                    isOpen && 'visible translate-x-0'
                )}
                id="admin-sidebar"
            >
                <div className="flex h-20 items-center justify-between gap-2 px-5">
                    <div className="flex flex-col">
                        <Logo />
                        <span className="pl-1 text-xs font-medium text-muted">
                            Admin Panel
                        </span>
                    </div>
                    <button
                        aria-label="Đóng menu quản trị"
                        className="grid size-11 cursor-pointer place-items-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus lg:hidden"
                        onClick={onClose}
                        ref={closeButtonRef}
                        type="button"
                    >
                        <X aria-hidden="true" className="size-5" />
                    </button>
                </div>

                <nav
                    aria-label="Điều hướng quản trị"
                    className="flex-1 space-y-1 overflow-y-auto px-3 py-4"
                >
                    {adminNavigationItems.map(
                        ({ icon: Icon, label, to, end, badgeKey }) => (
                            <NavLink
                                className={({ isActive }) =>
                                    cn(
                                        'relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-foreground-secondary transition-colors hover:bg-surface hover:text-heading focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus',
                                        isActive &&
                                            'bg-brand-subtle text-brand before:absolute before:inset-y-1.5 before:-left-3 before:w-1 before:rounded-r-full before:bg-brand hover:bg-brand-subtle-hover hover:text-brand-active'
                                    )
                                }
                                end={end}
                                key={to}
                                onClick={onClose}
                                to={to}
                            >
                                <Icon
                                    aria-hidden="true"
                                    className="size-5 shrink-0"
                                />
                                <span className="flex-1">{label}</span>
                                {badgeKey && BADGE_VALUES[badgeKey] > 0 && (
                                    <span className="min-w-6 rounded-full bg-feedback-danger-border px-1.5 py-0.5 text-center text-xs font-bold text-on-brand">
                                        <span className="sr-only">Có </span>
                                        {BADGE_VALUES[badgeKey]}
                                        <span className="sr-only">
                                            {' '}
                                            báo cáo chờ xử lý
                                        </span>
                                    </span>
                                )}
                            </NavLink>
                        )
                    )}
                </nav>
            </aside>
        </>
    );
}
