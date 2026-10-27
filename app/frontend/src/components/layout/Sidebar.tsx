import type { LucideIcon } from 'lucide-react';
import { Bell, FileText, Home, MessagesSquare, Server, X, Settings} from 'lucide-react';
import { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';

import { Logo } from '@/components/Logo';
import { cn } from '@/lib/utils';
import Avatar from '@/components/Avatar'

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

interface NavigationItem {
    icon: LucideIcon;
    label: string;
    to: string;
}

const navigationItems: NavigationItem[] = [
    { icon: Home, label: 'Trang chủ', to: '/home' },
    { icon: Server, label: 'Server', to: '/servers' },
    { icon: FileText, label: 'Tài liệu', to: '/documents' },
    { icon: MessagesSquare, label: 'Diễn đàn', to: '/forum' },
    { icon: Bell, label: 'Thông báo', to: '/notifications' },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const focusFrame = requestAnimationFrame(() =>
            closeButtonRef.current?.focus()
        );

        function closeOnEscape(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                onClose();
            }
        }

        document.addEventListener('keydown', closeOnEscape);

        return () => {
            cancelAnimationFrame(focusFrame);
            document.removeEventListener('keydown', closeOnEscape);
            requestAnimationFrame(() => {
                document.getElementById('sidebar-menu-trigger')?.focus();
            });
        };
    }, [isOpen, onClose]);

    return (
        <>
            {isOpen && (
                <button
                    aria-label="Đóng menu"
                    className="fixed inset-0 z-40 cursor-pointer bg-heading/30 md:hidden"
                    onClick={onClose}
                    type="button"
                />
            )}

            <aside
                className={cn(
                    'invisible fixed inset-y-0 left-0 z-50 flex w-60 -translate-x-full flex-col border-r border-line bg-surface transition-transform duration-200 ease-out motion-reduce:transition-none md:visible md:translate-x-0',
                    isOpen && 'visible translate-x-0'
                )}
                id="app-sidebar"
            >
                <div className="flex h-16 items-center justify-between border-b border-line-subtle px-4">
                    <Logo />
                    <button
                        aria-label="Đóng menu"
                        className="grid size-11 cursor-pointer place-items-center rounded-lg text-muted transition-colors hover:bg-surface-subtle hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus md:hidden"
                        onClick={onClose}
                        ref={closeButtonRef}
                        type="button"
                    >
                        <X aria-hidden="true" className="size-5" />
                    </button>
                </div>

                <nav
                    aria-label="Điều hướng chính"
                    className="flex-1 space-y-1 p-3"
                >
                    {navigationItems.map(({ icon: Icon, label, to }) => (
                        <NavLink
                            className={({ isActive }) =>
                                cn(
                                    'flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-foreground-secondary transition-colors hover:bg-surface-subtle hover:text-heading focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus',
                                    isActive &&
                                        'bg-brand-subtle text-brand hover:bg-brand-subtle-hover hover:text-brand-active'
                                )
                            }
                            key={to}
                            onClick={onClose}
                            to={to}
                        >
                            <Icon aria-hidden="true" className="size-5" />
                            <span>{label}</span>
                        </NavLink>
                    ))}
                </nav>
                <div className="w-full flex items-center justify-between md:px-8 px-6 py-4 border-t border-line-subtle">
                    <Avatar />
                <button
                    aria-label="Cài đặt"
                    className="grid size-10 cursor-pointer place-items-center rounded-lg text-foreground-secondary transition-colors duration-300 ease-out hover:bg-brand-subtle hover:text-brand focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                    type="button"
                >
                    <Settings aria-hidden="true" size={24} strokeWidth={1.8} />
                </button>
                </div>

            </aside>
        </>
    );
}
