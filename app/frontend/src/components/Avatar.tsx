import { ChevronDown, LayoutDashboard, LogOut, UserRound } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/common/Button';
import { useAuth } from '@/context/useAuth';
import { cn } from '@/lib/utils';

export default function Avatar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const menuId = useId();
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const displayName = user?.fullName?.trim() || 'Cloudian';
    const initial = displayName.charAt(0).toUpperCase();
    const isAdmin = user?.systemRole === 'ADMIN';

    useEffect(() => {
        if (!isOpen) return;

        function closeOnOutsideClick(event: MouseEvent) {
            if (!containerRef.current?.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        function closeOnKeyboard(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                event.preventDefault();
                setIsOpen(false);
                triggerRef.current?.focus();
            } else if (event.key === 'Tab') {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', closeOnOutsideClick);
        document.addEventListener('keydown', closeOnKeyboard);
        return () => {
            document.removeEventListener('mousedown', closeOnOutsideClick);
            document.removeEventListener('keydown', closeOnKeyboard);
        };
    }, [isOpen]);

    async function handleLogout() {
        if (isLoggingOut) return;

        setIsOpen(false);
        setIsLoggingOut(true);
        await logout().catch(() => undefined);
        setIsLoggingOut(false);
        navigate('/login', { replace: true });
    }

    return (
        <div className="relative" ref={containerRef}>
            <Button
                aria-controls={menuId}
                aria-expanded={isOpen}
                aria-haspopup="menu"
                aria-label={`Tài khoản ${displayName}`}
                className="min-h-11 cursor-pointer px-1.5"
                onClick={() => setIsOpen((open) => !open)}
                ref={triggerRef}
                size="compact"
                variant="ghost"
            >
                <span
                    aria-label={`Ảnh đại diện ${displayName}`}
                    className="grid size-10 place-items-center rounded-full bg-brand text-sm font-bold text-on-brand"
                    role="img"
                >
                    {initial}
                </span>
                <span className="flex flex-col items-start justify-between">
                    <span className="hidden text-sm font-bold text-heading lg:block">
                        {displayName}
                    </span>
                    <span className="hidden text-xs font-semibold text-gray-400 lg:block">
                        {isAdmin ? 'Admin' : 'Student'}
                    </span>
                </span>
                <ChevronDown
                    aria-hidden="true"
                    className={cn(
                        'hidden size-4 text-muted transition-transform lg:block',
                        isOpen && 'rotate-180'
                    )}
                />
            </Button>

            <div
                className="absolute right-0 top-full z-40 mt-2 w-44 rounded-xl border border-line-subtle bg-surface py-1.5 shadow-auth-card"
                hidden={!isOpen}
                id={menuId}
                role="menu"
            >
                <button
                    className="flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-surface-subtle focus-visible:bg-surface-subtle focus-visible:outline-none"
                    onClick={() => setIsOpen(false)}
                    role="menuitem"
                    type="button"
                >
                    <UserRound aria-hidden="true" className="size-4" />
                    Profile
                </button>
                {isAdmin && (
                    <button
                        className="flex w-full cursor-pointer items-center gap-2.5 border-t border-line-subtle px-3.5 py-2 text-left text-sm font-semibold text-brand transition-colors hover:bg-brand-subtle focus-visible:bg-brand-subtle focus-visible:outline-none"
                        onClick={() => {
                            setIsOpen(false);
                            navigate('/admin');
                        }}
                        role="menuitem"
                        type="button"
                    >
                        <LayoutDashboard
                            aria-hidden="true"
                            className="size-4"
                        />
                        Admin Dashboard
                    </button>
                )}
                <button
                    className="flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2 text-left text-sm text-feedback-danger transition-colors hover:bg-danger-subtle focus-visible:bg-danger-subtle focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60"
                    disabled={isLoggingOut}
                    onClick={() => void handleLogout()}
                    role="menuitem"
                    type="button"
                >
                    <LogOut aria-hidden="true" className="size-4" />
                    {isLoggingOut ? 'Logging out...' : 'Logout'}
                </button>
            </div>
        </div>
    );
}
