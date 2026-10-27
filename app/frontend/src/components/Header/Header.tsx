import { Menu, Search } from 'lucide-react';

import { Logo } from '@/components/Logo';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { NotificationBell } from '@/features/notification/components/NotificationBell';
import Avatar from '../Avatar';

interface HeaderProps {
    isMenuOpen?: boolean;
    onMenuClick?: () => void;
}

export function Header({ isMenuOpen = false, onMenuClick }: HeaderProps) {
    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center gap-3 border-b border-line bg-surface px-3 sm:px-5">
            {onMenuClick && (
                <Button
                    aria-controls="app-sidebar"
                    aria-expanded={isMenuOpen}
                    aria-label="Mở menu"
                    className="shrink-0 cursor-pointer md:hidden"
                    id="sidebar-menu-trigger"
                    onClick={onMenuClick}
                    size="icon"
                    variant="ghost"
                >
                    <Menu aria-hidden="true" className="size-5" />
                </Button>
            )}

            <div className="shrink-0 md:hidden">
                <Logo />
            </div>

            <div className="w-full text-sm lg:text-base sm:block">
                <Input
                    aria-label="Tìm kiếm server"
                    placeholder="Tìm server của bạn..."
                    size="compact"
                    startIcon={<Search className="size-4 lg:size-5" />}
                    type="search"
                />
            </div>

            <div className="ml-auto lg:ml-8 md:ml-6 flex shrink-0 items-center gap-2 sm:gap-3">
                <NotificationBell />
                <Avatar />
            </div>
        </header>
    );
}
