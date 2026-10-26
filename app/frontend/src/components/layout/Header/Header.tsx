import { Logo } from '@/components/Logo';
import { NotificationBell } from '@/features/notification/components/NotificationBell';

export const Header = () => {
    return (
        <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-line bg-surface/95 px-4 shadow-sm backdrop-blur sm:px-6">
            <Logo />

            <div className="flex items-center gap-3">
                <NotificationBell />
                <span
                    aria-label="Tài khoản người dùng"
                    className="grid size-11 place-items-center rounded-full border border-line-brand bg-brand-subtle text-sm font-bold text-brand"
                    role="img"
                >
                    U
                </span>
            </div>
        </header>
    );
};
