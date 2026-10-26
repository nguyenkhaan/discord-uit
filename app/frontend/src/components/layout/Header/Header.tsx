import { Link } from 'react-router-dom';

import Logo from '@/assets/images/Logo.webp';
import { NotificationBell } from '@/components/layout/Header/NotificationBell';

export const Header = () => {
    return (
        <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-line bg-surface/95 px-4 shadow-sm backdrop-blur sm:px-6">
            <Link
                aria-label="Về trang chủ UIT Connect"
                className="rounded-lg focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                to="/"
            >
                <img
                    alt="UIT Connect"
                    className="h-8 object-contain"
                    src={Logo}
                />
            </Link>

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
