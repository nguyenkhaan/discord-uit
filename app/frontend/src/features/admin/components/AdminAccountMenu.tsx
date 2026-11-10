import { ChevronDown, House, LogOut } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/context/useAuth';
import { cn } from '@/lib/utils';

export function AdminAccountMenu() {
    const menuId = useId();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const displayName = user?.fullName?.trim() || 'Admin';

    useEffect(() => {
        if (!isOpen) return;

        function handlePointerDown(event: MouseEvent) {
            if (!containerRef.current?.contains(event.target as Node))
                setIsOpen(false);
        }
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setIsOpen(false);
                triggerRef.current?.focus();
            }
        }
        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    async function handleLogout() {
        setIsOpen(false);
        await logout();
        navigate('/login', { replace: true });
    }

    const itemClass =
        'flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2 text-left text-sm transition-colors focus-visible:outline-none';

    return (
        <div className="relative" ref={containerRef}>
            <button
                aria-controls={isOpen ? menuId : undefined}
                aria-expanded={isOpen}
                aria-haspopup="menu"
                aria-label={`Tài khoản ${displayName}`}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-1.5 transition-colors hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                onClick={() => setIsOpen((open) => !open)}
                ref={triggerRef}
                type="button"
            >
                <span
                    aria-hidden="true"
                    className="grid size-10 place-items-center rounded-full bg-brand text-base font-semibold text-on-brand"
                >
                    {displayName.charAt(0).toUpperCase()}
                </span>
                <span className="hidden max-w-40 truncate text-sm font-semibold text-heading sm:block">
                    {displayName}
                </span>
                <ChevronDown
                    aria-hidden="true"
                    className={cn(
                        'hidden size-4 text-muted transition-transform sm:block',
                        isOpen && 'rotate-180'
                    )}
                />
            </button>

            {isOpen && (
                <div
                    className="absolute top-full right-0 z-40 mt-2 w-52 rounded-xl border border-line-subtle bg-surface py-1.5 shadow-auth-card"
                    id={menuId}
                    role="menu"
                >
                    <div className="border-b border-line-subtle px-3.5 pt-1 pb-2">
                        <p className="truncate text-sm font-semibold text-heading">
                            {displayName}
                        </p>
                        <p className="truncate text-xs text-muted">
                            {user?.email ?? 'Quản trị viên'}
                        </p>
                    </div>
                    <button
                        className={cn(
                            itemClass,
                            'mt-1 text-foreground hover:bg-surface-subtle focus-visible:bg-surface-subtle'
                        )}
                        onClick={() => navigate('/home')}
                        role="menuitem"
                        type="button"
                    >
                        <House aria-hidden="true" className="size-4" />
                        Về trang người dùng
                    </button>
                    <button
                        className={cn(
                            itemClass,
                            'text-feedback-danger hover:bg-danger-subtle focus-visible:bg-danger-subtle'
                        )}
                        onClick={() => void handleLogout()}
                        role="menuitem"
                        type="button"
                    >
                        <LogOut aria-hidden="true" className="size-4" />
                        Đăng xuất
                    </button>
                </div>
            )}
        </div>
    );
}
